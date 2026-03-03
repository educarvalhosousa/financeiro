-- Permite que usuários vejam outros perfis que tenham o mesmo household_id
CREATE POLICY "Usuários podem ver membros da mesma casa" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE household_id = profiles.household_id
  )
);
