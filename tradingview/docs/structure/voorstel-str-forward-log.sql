-- VOORSTEL — NIET UITGEVOERD. Alleen na expliciet akkoord van Bas.
-- Append-only forwardlogboek voor STR_0.1-F (en latere versies). Geen UPDATE/DELETE; correcties zijn nieuwe regels.
create schema if not exists bfx_lab;

create table if not exists bfx_lab.str_forward_log (
  seq          bigserial primary key,
  recorded_at  timestamptz not null default now(),          -- ontvangstmoment in de database (bewijs van "vóór de uitkomst")
  type         text not null check (type in ('setup_ontstaan','setup_uitkomst','kandidaat','correctie','verversing')),
  versie       text not null,                                -- bv. STR_0.1-F
  template_sha text not null,                                -- sha256 van het Pine-template (uit het bericht)
  snapshot_id  text not null,                                -- datablok (ENG_GENERATED)
  symbol       text not null,                                -- bv. FX:EURUSD
  feed         text not null,                                -- provider/prefix (FX = FXCM-feed in TradingView)
  timeframe    text not null,
  setup_id     text,                                         -- box_id@bevestigd (null bij 'kandidaat'/'verversing')
  payload      jsonb not null,                               -- volledig alertbericht (BFX_EXEC_0.1 / BFX_KAND_0.1)
  prev_hash    text not null,
  row_hash     text not null unique                          -- sha256(prev_hash || canonical(seq, recorded_at, type, payload))
);
create unique index if not exists str_forward_log_ontstaan on bfx_lab.str_forward_log (setup_id) where type = 'setup_ontstaan';
create unique index if not exists str_forward_log_uitkomst on bfx_lab.str_forward_log (setup_id) where type = 'setup_uitkomst';

-- Append-only afdwingen
create or replace function bfx_lab.str_forward_log_append_only() returns trigger language plpgsql as $$
begin raise exception 'str_forward_log is append-only (% geweigerd)', tg_op; end $$;
create trigger str_forward_log_no_update before update or delete on bfx_lab.str_forward_log
  for each row execute function bfx_lab.str_forward_log_append_only();

-- Leesview: stand per setup (oorspronkelijke uitkomst + laatste correctie, niets overschreven)
create or replace view bfx_lab.v_str_forward_stand as
select o.setup_id, o.symbol, o.timeframe, o.versie, o.template_sha,
       (o.payload->'setup'->>'bevestigd_op')::timestamptz as bevestigd_op,
       o.payload->'setup' as setup_bij_ontstaan,
       u.payload->'setup'->>'uitkomst' as uitkomst, (u.payload->'setup'->>'r_bruto')::numeric as r_bruto,
       c.payload as laatste_correctie, o.recorded_at as ontstaan_ontvangen, u.recorded_at as uitkomst_ontvangen
from bfx_lab.str_forward_log o
left join bfx_lab.str_forward_log u on u.setup_id = o.setup_id and u.type = 'setup_uitkomst'
left join lateral (select payload from bfx_lab.str_forward_log c where c.type = 'correctie' and c.payload->>'setup_id' = o.setup_id order by seq desc limit 1) c on true
where o.type = 'setup_ontstaan';

-- Schrijven alleen via een Edge Function met eigen geheim (geen anon-schrijfrechten; zie A-08-les).
revoke all on bfx_lab.str_forward_log from anon, authenticated;
