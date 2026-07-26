drop policy if exists festorga_events_select on festorga_events;

create policy festorga_events_select on festorga_events
  for select
  using (festorga_is_participant(id) or organizer_id = auth.uid());
