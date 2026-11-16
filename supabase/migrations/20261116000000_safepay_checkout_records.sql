-- Safepay checkout records: link public billing checkout to student, inquiry,
-- payment, invoice, and service-order records.
alter table public.student_inquiries
  drop constraint if exists student_inquiries_lesson_duration_minutes_check;
alter table public.student_inquiries
  add constraint student_inquiries_lesson_duration_minutes_check
  check (lesson_duration_minutes = any (array[25,30,50]));

create or replace function public.create_safepay_checkout_records(
  p_student_id uuid,
  p_order_id text,
  p_amount numeric,
  p_description text,
  p_order_type text,
  p_inquiry jsonb default null,
  p_student_remark text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_role public.app_role;
  v_active boolean;
  v_inquiry_id uuid := null;
  v_payment_id uuid;
  v_invoice_id uuid;
  v_service_order_id uuid;
  v_duration integer;
  v_lessons integer;
  v_title text;
begin
  if p_student_id is null
     or p_order_id is null
     or length(p_order_id) < 8
     or length(p_order_id) > 100
     or p_amount is null
     or p_amount <= 0
     or p_amount > 10000000
     or p_order_type not in ('class', 'resource') then
    raise exception 'Invalid checkout record input';
  end if;

  select role, is_active into v_role, v_active
  from public.profiles
  where id = p_student_id;

  if not found or v_role <> 'student'::public.app_role or v_active is not true then
    raise exception 'A valid active student profile is required';
  end if;

  if p_order_type = 'class' then
    if p_inquiry is null then
      raise exception 'Lesson checkout requires inquiry details';
    end if;
    v_duration := coalesce(nullif(p_inquiry->>'lesson_duration_minutes','')::integer, 50);
    v_lessons := coalesce(nullif(p_inquiry->>'lessons_count','')::integer, 1);
    if v_duration not in (25, 30, 50) or v_lessons < 1 or v_lessons > 31 then
      raise exception 'Invalid lesson details';
    end if;

    insert into public.student_inquiries (
      student_id, subject, curriculum, requirement_summary, preferred_days,
      timezone, lesson_duration_minutes, lessons_count, package, budget, status
    ) values (
      p_student_id,
      left(coalesce(p_inquiry->>'subject','General tutoring'), 180),
      left(coalesce(p_inquiry->>'curriculum',''), 180),
      left(coalesce(p_inquiry->>'requirement_summary',''), 4000),
      left(coalesce(p_inquiry->>'preferred_days',''), 300),
      'Asia/Karachi',
      v_duration,
      v_lessons,
      left(coalesce(p_inquiry->>'package',''), 100),
      left(coalesce(p_inquiry->>'budget',''), 100),
      'awaiting_payment'
    )
    returning id into v_inquiry_id;
  end if;

  insert into public.payments (
    student_id, amount, currency, status, provider, inquiry_id
  ) values (
    p_student_id, p_amount, 'PKR', 'pending', 'safepay', v_inquiry_id
  ) returning id into v_payment_id;

  insert into public.invoices (
    invoice_number, inquiry_id, payment_id, student_id,
    amount, currency, status, description
  ) values (
    public.next_learning_hub_invoice_number(),
    v_inquiry_id,
    v_payment_id,
    p_student_id,
    p_amount,
    'PKR',
    'issued',
    left(coalesce(p_description,'Learning Hub order'), 500)
  ) returning id into v_invoice_id;

  v_title := left(coalesce(p_description,'Learning Hub order'), 500);

  insert into public.service_orders (
    order_number, student_id, inquiry_id, payment_id, invoice_id,
    order_type, title, amount, currency, status, student_remark
  ) values (
    p_order_id, p_student_id, v_inquiry_id, v_payment_id, v_invoice_id,
    p_order_type, v_title, p_amount, 'PKR', 'payment_pending',
    left(coalesce(p_student_remark,''), 4000)
  ) returning id into v_service_order_id;

  return jsonb_build_object(
    'inquiry_id', v_inquiry_id,
    'payment_id', v_payment_id,
    'invoice_id', v_invoice_id,
    'service_order_id', v_service_order_id
  );
end;
$function$;

revoke all on function public.create_safepay_checkout_records(uuid,text,numeric,text,text,jsonb,text) from public;
revoke all on function public.create_safepay_checkout_records(uuid,text,numeric,text,text,jsonb,text) from anon, authenticated;
grant execute on function public.create_safepay_checkout_records(uuid,text,numeric,text,text,jsonb,text) to service_role;
