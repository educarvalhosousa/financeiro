-- Function to call the Edge Function when a new transaction is created
create or replace function public.notify_new_transaction()
returns trigger as $$
declare
  edge_function_url text := 'https://fruovsezhxikocqsrioo.supabase.co/functions/v1/send-push';
  service_role_key text := current_setting('app.settings.service_role_key', true);
  payload json;
  request_id bigint;
begin
  -- Prepare the payload for the Edge Function
  -- We want to notify the user about their new transaction
  payload := json_build_object(
    'userId', new.user_id,
    'title', 'Nova Transação: ' || new.category,
    'body', new.name || ' no valor de R$ ' || new.value,
    'data', '/'
  );

  -- Call the Edge Function using the pg_net extension
  -- Make sure pg_net is enabled in your Supabase project (Extensions -> pg_net)
  select net.http_post(
      url:='https://fruovsezhxikocqsrioo.supabase.co/functions/v1/send-push',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body:=payload::jsonb
  ) into request_id;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute the function on new transactions
drop trigger if exists on_new_transaction on public.transactions;
create trigger on_new_transaction
  after insert on public.transactions
  for each row execute procedure public.notify_new_transaction();
