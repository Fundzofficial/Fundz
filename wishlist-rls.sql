alter table public.wishlist enable row level security;

drop policy if exists "fundz_wishlist_select_own" on public.wishlist;
create policy "fundz_wishlist_select_own"
  on public.wishlist
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "fundz_wishlist_insert_own" on public.wishlist;
create policy "fundz_wishlist_insert_own"
  on public.wishlist
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "fundz_wishlist_delete_own" on public.wishlist;
create policy "fundz_wishlist_delete_own"
  on public.wishlist
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);