-- Legacy rows retain their IDs, difficulty and null metadata.
alter table public.questions
  add column executive_track text,
  add column category_slug text,
  add column number_friendliness smallint,
  add column operation_count smallint,
  add column publication_status text,
  add constraint questions_executive_metadata_check check (
    (executive_track is null and category_slug is null and number_friendliness is null
      and operation_count is null and publication_status is null)
    or (executive_track is not null and category_slug is not null
      and number_friendliness is not null and operation_count is not null
      and publication_status is not null and difficulty between 1 and 3
      and number_friendliness between 1 and 5 and operation_count > 0
      and publication_status in ('draft', 'approved', 'published', 'retired')
      and correct_answer = round(correct_answer, 2))
  ),
  add constraint questions_track_category_check check (
    executive_track is null or (executive_track = 'ceo' and category_slug in ('growth-and-market-share', 'strategic-trade-offs', 'resource-allocation', 'portfolio-decisions', 'pricing-and-profitability', 'acquisitions-and-divestitures', 'capital-allocation', 'scenario-planning', 'competitive-benchmarking', 'enterprise-valuation'))
    or (executive_track = 'coo' and category_slug in ('capacity-and-utilization', 'throughput-and-bottlenecks', 'productivity', 'yield-and-scrap', 'inventory-turns', 'lead-and-cycle-times', 'service-levels', 'cost-reduction', 'quality-and-defect-rates', 'operating-leverage'))
    or (executive_track = 'cfo' and category_slug in ('revenue-and-expense-forecasting', 'gross-and-operating-margins', 'cash-flow', 'working-capital', 'breakeven', 'financing-and-leverage', 'return-on-invested-capital', 'valuation-multiples', 'dilution-and-per-share-value', 'budget-variance'))
    or (executive_track = 'cro' and category_slug in ('pipeline-coverage', 'funnel-conversion', 'quota-attainment', 'average-contract-value', 'sales-productivity', 'commissions', 'discounting', 'expansion-and-churn', 'territory-planning', 'revenue-forecasting'))
    or (executive_track = 'cmo' and category_slug in ('customer-acquisition-cost', 'return-on-advertising-spend', 'funnel-conversion', 'attribution', 'campaign-economics', 'customer-lifetime-value', 'channel-mix', 'market-sizing', 'cohort-retention', 'brand-and-demand-lift'))
    or (executive_track = 'cpo' and category_slug in ('activation', 'engagement', 'retention-and-churn', 'feature-adoption', 'conversion', 'pricing-and-packaging', 'experiment-analysis', 'product-led-growth', 'monetization', 'roadmap-trade-offs'))
    or (executive_track = 'cto' and category_slug in ('infrastructure-capacity', 'cloud-unit-economics', 'reliability-and-availability', 'latency-and-performance', 'engineering-throughput', 'technical-debt-economics', 'build-versus-buy', 'scaling-laws', 'energy-and-power', 'architecture-trade-offs'))
    or (executive_track = 'cio' and category_slug in ('systems-utilization', 'automation-returns', 'data-quality', 'model-precision-and-recall', 'ai-inference-economics', 'storage-and-compute-growth', 'vendor-economics', 'migration-planning', 'cybersecurity-exposure', 'technology-portfolio-value'))
    or (executive_track = 'chro' and category_slug in ('headcount-planning', 'hiring-funnels', 'attrition-and-retention', 'compensation', 'span-of-control', 'workforce-productivity', 'training-returns', 'absence-and-utilization', 'diversity-representation', 'organizational-cost'))
    or (executive_track = 'supply_chain' and category_slug in ('demand-planning', 'inventory-levels', 'supplier-pricing', 'purchase-volume-discounts', 'logistics-costs', 'lead-times', 'safety-stock', 'production-yield', 'make-versus-buy', 'supplier-risk'))
    or (executive_track = 'risk' and category_slug in ('probability-of-loss', 'expected-loss', 'exposure-concentration', 'scenario-analysis', 'conditional-probability', 'sensitivity-and-stress-tests', 'insurance-economics', 'credit-risk', 'operational-risk', 'risk-adjusted-returns'))
  );

create index questions_published_track_difficulty_idx
  on public.questions (executive_track, difficulty, category_slug, id)
  where is_active and publication_status = 'published';
create index questions_legacy_idx on public.questions (id)
  where is_active and executive_track is null;
create index attempts_user_question_idx on public.attempts (user_id, question_id);

create function public.text_array_has_unique_elements(values_to_check text[])
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select count(*) = count(distinct value)
  from unnest(values_to_check) as elements(value)
$$;

alter table public.practice_sessions
  add column selected_tracks text[],
  add constraint practice_sessions_selected_tracks_check check (
    selected_tracks is null or (
      selected_tracks <@ array['ceo', 'coo', 'cfo', 'cro', 'cmo', 'cpo', 'cto', 'cio', 'chro', 'supply_chain', 'risk']::text[]
      and array_position(selected_tracks, null) is null
      and cardinality(selected_tracks) <= 11
      and public.text_array_has_unique_elements(selected_tracks)
    )
  );

drop policy "Authenticated users can read active questions" on public.questions;
create policy "Users can read published questions and their historical questions"
  on public.questions for select to authenticated using (
    (is_active and (publication_status = 'published' or executive_track is null))
    or ((publication_status = 'retired' or executive_track is null) and exists (
      select 1 from public.attempts
      where attempts.question_id = questions.id and attempts.user_id = (select auth.uid())
    ))
  );
-- Existing grants remain read-only for questions; authoring is operator-only.
