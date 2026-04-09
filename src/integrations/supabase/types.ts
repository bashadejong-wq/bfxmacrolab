export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alignment_engine: {
        Row: {
          alignment_date: string
          alignment_state: string | null
          aud_view: string | null
          cad_view: string | null
          cb_alignment_narrative: string | null
          cb_view: string | null
          chf_view: string | null
          commodity_view: string | null
          conflicts: string | null
          conviction_score: number | null
          core_driver: string | null
          created_at: string | null
          currency_ranking: string | null
          currency_view: string | null
          curve_view: string | null
          daily_snapshot_id: number | null
          daily_vs_weekly: string | null
          equity_view: string | null
          eur_view: string | null
          flow_chain: string | null
          gbp_view: string | null
          gold_view: string | null
          growth_alignment: string | null
          growth_view: string | null
          high_conviction_assets: string | null
          id: number
          inflation_alignment: string | null
          inflation_view: string | null
          jpy_view: string | null
          key_watchpoints: string | null
          liquidity_alignment: string | null
          liquidity_regime: string | null
          liquidity_view: string | null
          low_conviction_assets: string | null
          macro_regime: string | null
          macro_story: string | null
          market_sensitivity: string | null
          monthly_snapshot_id: number | null
          nzd_view: string | null
          oil_view: string | null
          priced_in_assessment: string | null
          rates_view: string | null
          real_yield_view: string | null
          risk_regime: string | null
          risk_sentiment: string | null
          scenario_base: string | null
          scenario_downside: string | null
          scenario_upside: string | null
          spx_view: string | null
          summary: string | null
          summary_dashboard: string | null
          summary_micro: string | null
          trading_implications: string | null
          transmission_summary: string | null
          us_10y_view: string | null
          us_2y_view: string | null
          usd_view: string | null
          vix_view: string | null
          weekly_snapshot_id: number | null
          weekly_vs_monthly: string | null
          what_to_avoid: string | null
          what_to_do: string | null
          yield_curve_analysis: string | null
          yield_differential_view: string | null
          yield_signal_summary: string | null
          yield_view: string | null
        }
        Insert: {
          alignment_date: string
          alignment_state?: string | null
          aud_view?: string | null
          cad_view?: string | null
          cb_alignment_narrative?: string | null
          cb_view?: string | null
          chf_view?: string | null
          commodity_view?: string | null
          conflicts?: string | null
          conviction_score?: number | null
          core_driver?: string | null
          created_at?: string | null
          currency_ranking?: string | null
          currency_view?: string | null
          curve_view?: string | null
          daily_snapshot_id?: number | null
          daily_vs_weekly?: string | null
          equity_view?: string | null
          eur_view?: string | null
          flow_chain?: string | null
          gbp_view?: string | null
          gold_view?: string | null
          growth_alignment?: string | null
          growth_view?: string | null
          high_conviction_assets?: string | null
          id?: number
          inflation_alignment?: string | null
          inflation_view?: string | null
          jpy_view?: string | null
          key_watchpoints?: string | null
          liquidity_alignment?: string | null
          liquidity_regime?: string | null
          liquidity_view?: string | null
          low_conviction_assets?: string | null
          macro_regime?: string | null
          macro_story?: string | null
          market_sensitivity?: string | null
          monthly_snapshot_id?: number | null
          nzd_view?: string | null
          oil_view?: string | null
          priced_in_assessment?: string | null
          rates_view?: string | null
          real_yield_view?: string | null
          risk_regime?: string | null
          risk_sentiment?: string | null
          scenario_base?: string | null
          scenario_downside?: string | null
          scenario_upside?: string | null
          spx_view?: string | null
          summary?: string | null
          summary_dashboard?: string | null
          summary_micro?: string | null
          trading_implications?: string | null
          transmission_summary?: string | null
          us_10y_view?: string | null
          us_2y_view?: string | null
          usd_view?: string | null
          vix_view?: string | null
          weekly_snapshot_id?: number | null
          weekly_vs_monthly?: string | null
          what_to_avoid?: string | null
          what_to_do?: string | null
          yield_curve_analysis?: string | null
          yield_differential_view?: string | null
          yield_signal_summary?: string | null
          yield_view?: string | null
        }
        Update: {
          alignment_date?: string
          alignment_state?: string | null
          aud_view?: string | null
          cad_view?: string | null
          cb_alignment_narrative?: string | null
          cb_view?: string | null
          chf_view?: string | null
          commodity_view?: string | null
          conflicts?: string | null
          conviction_score?: number | null
          core_driver?: string | null
          created_at?: string | null
          currency_ranking?: string | null
          currency_view?: string | null
          curve_view?: string | null
          daily_snapshot_id?: number | null
          daily_vs_weekly?: string | null
          equity_view?: string | null
          eur_view?: string | null
          flow_chain?: string | null
          gbp_view?: string | null
          gold_view?: string | null
          growth_alignment?: string | null
          growth_view?: string | null
          high_conviction_assets?: string | null
          id?: number
          inflation_alignment?: string | null
          inflation_view?: string | null
          jpy_view?: string | null
          key_watchpoints?: string | null
          liquidity_alignment?: string | null
          liquidity_regime?: string | null
          liquidity_view?: string | null
          low_conviction_assets?: string | null
          macro_regime?: string | null
          macro_story?: string | null
          market_sensitivity?: string | null
          monthly_snapshot_id?: number | null
          nzd_view?: string | null
          oil_view?: string | null
          priced_in_assessment?: string | null
          rates_view?: string | null
          real_yield_view?: string | null
          risk_regime?: string | null
          risk_sentiment?: string | null
          scenario_base?: string | null
          scenario_downside?: string | null
          scenario_upside?: string | null
          spx_view?: string | null
          summary?: string | null
          summary_dashboard?: string | null
          summary_micro?: string | null
          trading_implications?: string | null
          transmission_summary?: string | null
          us_10y_view?: string | null
          us_2y_view?: string | null
          usd_view?: string | null
          vix_view?: string | null
          weekly_snapshot_id?: number | null
          weekly_vs_monthly?: string | null
          what_to_avoid?: string | null
          what_to_do?: string | null
          yield_curve_analysis?: string | null
          yield_differential_view?: string | null
          yield_signal_summary?: string | null
          yield_view?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alignment_engine_daily_snapshot_id_fkey"
            columns: ["daily_snapshot_id"]
            isOneToOne: false
            referencedRelation: "period_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignment_engine_daily_snapshot_id_fkey"
            columns: ["daily_snapshot_id"]
            isOneToOne: false
            referencedRelation: "v_latest_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignment_engine_monthly_snapshot_id_fkey"
            columns: ["monthly_snapshot_id"]
            isOneToOne: false
            referencedRelation: "period_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignment_engine_monthly_snapshot_id_fkey"
            columns: ["monthly_snapshot_id"]
            isOneToOne: false
            referencedRelation: "v_latest_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignment_engine_weekly_snapshot_id_fkey"
            columns: ["weekly_snapshot_id"]
            isOneToOne: false
            referencedRelation: "period_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignment_engine_weekly_snapshot_id_fkey"
            columns: ["weekly_snapshot_id"]
            isOneToOne: false
            referencedRelation: "v_latest_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_master: {
        Row: {
          asset_class: string
          asset_code: string
          asset_group: string
          carry_role: string | null
          color_bearish: string | null
          color_bullish: string | null
          color_hex: string | null
          commodity_driven: boolean | null
          correlated_with: string[] | null
          country: string | null
          created_at: string | null
          currency_code: string | null
          description_en: string | null
          description_nl: string | null
          display_order: number | null
          dollar_sensitivity: string | null
          icon: string | null
          id: number
          inflation_sensitivity: string | null
          inverse_of: string[] | null
          is_active: boolean | null
          label_en: string
          label_nl: string
          rate_sensitive: boolean | null
          region: string | null
          risk_sensitivity: string | null
          safe_haven: boolean | null
          subcategory: string
          ticker_common: string | null
          ticker_eodhd: string | null
        }
        Insert: {
          asset_class: string
          asset_code: string
          asset_group: string
          carry_role?: string | null
          color_bearish?: string | null
          color_bullish?: string | null
          color_hex?: string | null
          commodity_driven?: boolean | null
          correlated_with?: string[] | null
          country?: string | null
          created_at?: string | null
          currency_code?: string | null
          description_en?: string | null
          description_nl?: string | null
          display_order?: number | null
          dollar_sensitivity?: string | null
          icon?: string | null
          id?: number
          inflation_sensitivity?: string | null
          inverse_of?: string[] | null
          is_active?: boolean | null
          label_en: string
          label_nl: string
          rate_sensitive?: boolean | null
          region?: string | null
          risk_sensitivity?: string | null
          safe_haven?: boolean | null
          subcategory: string
          ticker_common?: string | null
          ticker_eodhd?: string | null
        }
        Update: {
          asset_class?: string
          asset_code?: string
          asset_group?: string
          carry_role?: string | null
          color_bearish?: string | null
          color_bullish?: string | null
          color_hex?: string | null
          commodity_driven?: boolean | null
          correlated_with?: string[] | null
          country?: string | null
          created_at?: string | null
          currency_code?: string | null
          description_en?: string | null
          description_nl?: string | null
          display_order?: number | null
          dollar_sensitivity?: string | null
          icon?: string | null
          id?: number
          inflation_sensitivity?: string | null
          inverse_of?: string[] | null
          is_active?: boolean | null
          label_en?: string
          label_nl?: string
          rate_sensitive?: boolean | null
          region?: string | null
          risk_sensitivity?: string | null
          safe_haven?: boolean | null
          subcategory?: string
          ticker_common?: string | null
          ticker_eodhd?: string | null
        }
        Relationships: []
      }
      category_taxonomy: {
        Row: {
          category: string
          color_hex: string | null
          description: string | null
          display_label: string
          display_label_nl: string | null
          icon: string | null
          id: number
          sort_order: number | null
          subcategory: string
          table_name: string
        }
        Insert: {
          category: string
          color_hex?: string | null
          description?: string | null
          display_label: string
          display_label_nl?: string | null
          icon?: string | null
          id?: number
          sort_order?: number | null
          subcategory: string
          table_name: string
        }
        Update: {
          category?: string
          color_hex?: string | null
          description?: string | null
          display_label?: string
          display_label_nl?: string | null
          icon?: string | null
          id?: number
          sort_order?: number | null
          subcategory?: string
          table_name?: string
        }
        Relationships: []
      }
      currency_macro_snapshots: {
        Row: {
          bias: string | null
          carry_bias: string | null
          cb_direction: string | null
          cb_expectation: string | null
          cb_now: string | null
          cb_qe_qt: string | null
          cb_stance: string | null
          commodity_sensitivity: string | null
          confidence: string | null
          created_at: string
          cross_asset_narrative: string | null
          currency_cb_regime: string | null
          currency_code: string
          currency_growth_regime: string | null
          currency_inflation_regime: string | null
          currency_macro_regime: string | null
          currency_risk_regime: string | null
          currency_yield_regime: string | null
          driver_attribution: string | null
          equity_sensitivity: string | null
          flows_impact: string | null
          global_snapshot_id: number | null
          gold_sensitivity: string | null
          growth_expectation: string | null
          growth_now: string | null
          higher_tf_bias: string | null
          id: number
          important_for_today: string | null
          inflation_expectation: string | null
          inflation_now: string | null
          invalidation_risk: string | null
          key_cross_asset_driver: string | null
          liquidity_conditions: string | null
          liquidity_impact: string | null
          main_driver: string | null
          market_pricing: string | null
          medium_term_bias: string | null
          oil_sensitivity: string | null
          overall_score: number | null
          positioning: string | null
          rate_diff_vs_usd: string | null
          rate_differential: string | null
          raw_payload: Json | null
          real_yield: string | null
          regime_drivers: string | null
          regime_vs_global: string | null
          report_title: string | null
          report_type: string | null
          score_cb: number | null
          score_flows: number | null
          score_growth: number | null
          score_inflation: number | null
          score_liquidity: number | null
          sensitivity: string | null
          short_term_bias: string | null
          snapshot_date: string
          source: string | null
          summary_detailed: string | null
          summary_short: string | null
          timeframe_structural: string | null
          timeframe_tactical: string | null
          vix_sensitivity: string | null
          what_to_watch_next: string | null
          yield_10y: string | null
          yield_2y: string | null
          yields_now: string | null
        }
        Insert: {
          bias?: string | null
          carry_bias?: string | null
          cb_direction?: string | null
          cb_expectation?: string | null
          cb_now?: string | null
          cb_qe_qt?: string | null
          cb_stance?: string | null
          commodity_sensitivity?: string | null
          confidence?: string | null
          created_at?: string
          cross_asset_narrative?: string | null
          currency_cb_regime?: string | null
          currency_code: string
          currency_growth_regime?: string | null
          currency_inflation_regime?: string | null
          currency_macro_regime?: string | null
          currency_risk_regime?: string | null
          currency_yield_regime?: string | null
          driver_attribution?: string | null
          equity_sensitivity?: string | null
          flows_impact?: string | null
          global_snapshot_id?: number | null
          gold_sensitivity?: string | null
          growth_expectation?: string | null
          growth_now?: string | null
          higher_tf_bias?: string | null
          id?: number
          important_for_today?: string | null
          inflation_expectation?: string | null
          inflation_now?: string | null
          invalidation_risk?: string | null
          key_cross_asset_driver?: string | null
          liquidity_conditions?: string | null
          liquidity_impact?: string | null
          main_driver?: string | null
          market_pricing?: string | null
          medium_term_bias?: string | null
          oil_sensitivity?: string | null
          overall_score?: number | null
          positioning?: string | null
          rate_diff_vs_usd?: string | null
          rate_differential?: string | null
          raw_payload?: Json | null
          real_yield?: string | null
          regime_drivers?: string | null
          regime_vs_global?: string | null
          report_title?: string | null
          report_type?: string | null
          score_cb?: number | null
          score_flows?: number | null
          score_growth?: number | null
          score_inflation?: number | null
          score_liquidity?: number | null
          sensitivity?: string | null
          short_term_bias?: string | null
          snapshot_date: string
          source?: string | null
          summary_detailed?: string | null
          summary_short?: string | null
          timeframe_structural?: string | null
          timeframe_tactical?: string | null
          vix_sensitivity?: string | null
          what_to_watch_next?: string | null
          yield_10y?: string | null
          yield_2y?: string | null
          yields_now?: string | null
        }
        Update: {
          bias?: string | null
          carry_bias?: string | null
          cb_direction?: string | null
          cb_expectation?: string | null
          cb_now?: string | null
          cb_qe_qt?: string | null
          cb_stance?: string | null
          commodity_sensitivity?: string | null
          confidence?: string | null
          created_at?: string
          cross_asset_narrative?: string | null
          currency_cb_regime?: string | null
          currency_code?: string
          currency_growth_regime?: string | null
          currency_inflation_regime?: string | null
          currency_macro_regime?: string | null
          currency_risk_regime?: string | null
          currency_yield_regime?: string | null
          driver_attribution?: string | null
          equity_sensitivity?: string | null
          flows_impact?: string | null
          global_snapshot_id?: number | null
          gold_sensitivity?: string | null
          growth_expectation?: string | null
          growth_now?: string | null
          higher_tf_bias?: string | null
          id?: number
          important_for_today?: string | null
          inflation_expectation?: string | null
          inflation_now?: string | null
          invalidation_risk?: string | null
          key_cross_asset_driver?: string | null
          liquidity_conditions?: string | null
          liquidity_impact?: string | null
          main_driver?: string | null
          market_pricing?: string | null
          medium_term_bias?: string | null
          oil_sensitivity?: string | null
          overall_score?: number | null
          positioning?: string | null
          rate_diff_vs_usd?: string | null
          rate_differential?: string | null
          raw_payload?: Json | null
          real_yield?: string | null
          regime_drivers?: string | null
          regime_vs_global?: string | null
          report_title?: string | null
          report_type?: string | null
          score_cb?: number | null
          score_flows?: number | null
          score_growth?: number | null
          score_inflation?: number | null
          score_liquidity?: number | null
          sensitivity?: string | null
          short_term_bias?: string | null
          snapshot_date?: string
          source?: string | null
          summary_detailed?: string | null
          summary_short?: string | null
          timeframe_structural?: string | null
          timeframe_tactical?: string | null
          vix_sensitivity?: string | null
          what_to_watch_next?: string | null
          yield_10y?: string | null
          yield_2y?: string | null
          yields_now?: string | null
        }
        Relationships: []
      }
      entity_bias: {
        Row: {
          asset_group: string | null
          bias: string
          bias_strength: string | null
          carry_bias: string | null
          confidence: number | null
          context_id: number
          context_type: string
          created_at: string | null
          entity_class: string
          entity_code: string
          entity_label: string | null
          id: number
          invalidation: string | null
          main_driver: string | null
          note: string | null
          rate_diff: string | null
          region: string | null
          snap_date: string
          subcategory: string | null
          yield_support: string | null
        }
        Insert: {
          asset_group?: string | null
          bias: string
          bias_strength?: string | null
          carry_bias?: string | null
          confidence?: number | null
          context_id: number
          context_type: string
          created_at?: string | null
          entity_class: string
          entity_code: string
          entity_label?: string | null
          id?: number
          invalidation?: string | null
          main_driver?: string | null
          note?: string | null
          rate_diff?: string | null
          region?: string | null
          snap_date: string
          subcategory?: string | null
          yield_support?: string | null
        }
        Update: {
          asset_group?: string | null
          bias?: string
          bias_strength?: string | null
          carry_bias?: string | null
          confidence?: number | null
          context_id?: number
          context_type?: string
          created_at?: string | null
          entity_class?: string
          entity_code?: string
          entity_label?: string | null
          id?: number
          invalidation?: string | null
          main_driver?: string | null
          note?: string | null
          rate_diff?: string | null
          region?: string | null
          snap_date?: string
          subcategory?: string | null
          yield_support?: string | null
        }
        Relationships: []
      }
      event_release_history: {
        Row: {
          actual_value: number | null
          analyst_note: string | null
          country: string
          created_at: string | null
          currency: string
          data_source: string | null
          event_category: string
          event_name: string
          expected_value: number | null
          id: number
          previous_value: number | null
          reaction_audusd: number | null
          reaction_dxy: number | null
          reaction_eurusd: number | null
          reaction_gbpusd: number | null
          reaction_gold: number | null
          reaction_oil: number | null
          reaction_spx: number | null
          reaction_us10y: number | null
          reaction_us2y: number | null
          reaction_usdcad: number | null
          reaction_usdjpy: number | null
          release_date: string
          surprise_direction: string | null
          surprise_size: number | null
          unit: string | null
        }
        Insert: {
          actual_value?: number | null
          analyst_note?: string | null
          country: string
          created_at?: string | null
          currency: string
          data_source?: string | null
          event_category: string
          event_name: string
          expected_value?: number | null
          id?: number
          previous_value?: number | null
          reaction_audusd?: number | null
          reaction_dxy?: number | null
          reaction_eurusd?: number | null
          reaction_gbpusd?: number | null
          reaction_gold?: number | null
          reaction_oil?: number | null
          reaction_spx?: number | null
          reaction_us10y?: number | null
          reaction_us2y?: number | null
          reaction_usdcad?: number | null
          reaction_usdjpy?: number | null
          release_date: string
          surprise_direction?: string | null
          surprise_size?: number | null
          unit?: string | null
        }
        Update: {
          actual_value?: number | null
          analyst_note?: string | null
          country?: string
          created_at?: string | null
          currency?: string
          data_source?: string | null
          event_category?: string
          event_name?: string
          expected_value?: number | null
          id?: number
          previous_value?: number | null
          reaction_audusd?: number | null
          reaction_dxy?: number | null
          reaction_eurusd?: number | null
          reaction_gbpusd?: number | null
          reaction_gold?: number | null
          reaction_oil?: number | null
          reaction_spx?: number | null
          reaction_us10y?: number | null
          reaction_us2y?: number | null
          reaction_usdcad?: number | null
          reaction_usdjpy?: number | null
          release_date?: string
          surprise_direction?: string | null
          surprise_size?: number | null
          unit?: string | null
        }
        Relationships: []
      }
      fred_macro_indicators: {
        Row: {
          change_abs: number | null
          change_pct: number | null
          created_at: string | null
          fetch_date: string
          id: number
          previous_value: number | null
          series_id: string
          series_name: string | null
          source: string | null
          value: number | null
        }
        Insert: {
          change_abs?: number | null
          change_pct?: number | null
          created_at?: string | null
          fetch_date: string
          id?: number
          previous_value?: number | null
          series_id: string
          series_name?: string | null
          source?: string | null
          value?: number | null
        }
        Update: {
          change_abs?: number | null
          change_pct?: number | null
          created_at?: string | null
          fetch_date?: string
          id?: number
          previous_value?: number | null
          series_id?: string
          series_name?: string | null
          source?: string | null
          value?: number | null
        }
        Relationships: []
      }
      macro_dashboard_indicators: {
        Row: {
          category: string
          country_code: string
          fred_series_id: string | null
          frequency: string | null
          id: number
          indicator_key: string
          indicator_name: string
          latest: number | null
          latest_date: string | null
          mean_7c: number | null
          source: string | null
          t_minus_1: number | null
          t_minus_2: number | null
          t_minus_3: number | null
          t_minus_4: number | null
          t_minus_5: number | null
          t_minus_6: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          country_code: string
          fred_series_id?: string | null
          frequency?: string | null
          id?: number
          indicator_key: string
          indicator_name: string
          latest?: number | null
          latest_date?: string | null
          mean_7c?: number | null
          source?: string | null
          t_minus_1?: number | null
          t_minus_2?: number | null
          t_minus_3?: number | null
          t_minus_4?: number | null
          t_minus_5?: number | null
          t_minus_6?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          country_code?: string
          fred_series_id?: string | null
          frequency?: string | null
          id?: number
          indicator_key?: string
          indicator_name?: string
          latest?: number | null
          latest_date?: string | null
          mean_7c?: number | null
          source?: string | null
          t_minus_1?: number | null
          t_minus_2?: number | null
          t_minus_3?: number | null
          t_minus_4?: number | null
          t_minus_5?: number | null
          t_minus_6?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      macro_dashboard_regime: {
        Row: {
          cb_projections_updated: string | null
          country_code: string
          gdp_forecast: number | null
          id: number
          inflation_target: number | null
          policy_rate: number | null
          projection_year: string | null
          regime: string | null
          unemployment_forecast: number | null
          updated_at: string | null
        }
        Insert: {
          cb_projections_updated?: string | null
          country_code: string
          gdp_forecast?: number | null
          id?: number
          inflation_target?: number | null
          policy_rate?: number | null
          projection_year?: string | null
          regime?: string | null
          unemployment_forecast?: number | null
          updated_at?: string | null
        }
        Update: {
          cb_projections_updated?: string | null
          country_code?: string
          gdp_forecast?: number | null
          id?: number
          inflation_target?: number | null
          policy_rate?: number | null
          projection_year?: string | null
          regime?: string | null
          unemployment_forecast?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      macro_economic_releases: {
        Row: {
          actual_num: number | null
          actual_raw: string | null
          category: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          dedupe_hash: string | null
          event_date: string | null
          event_datetime_utc: string | null
          event_impact: string | null
          event_name: string
          event_status: string | null
          event_time_raw: string | null
          event_type: string | null
          event_url: string | null
          forecast_num: number | null
          forecast_raw: string | null
          id: number
          importance: string | null
          importance_score: number | null
          indicator_code: string | null
          notes: string | null
          previous_num: number | null
          previous_raw: string | null
          raw_payload: Json | null
          reference_period: string | null
          region: string | null
          revised_num: number | null
          revised_raw: string | null
          source_event_id: string | null
          source_name: string | null
          source_provider: string
          source_url: string | null
          subcategory: string | null
          surprise_direction: string | null
          surprise_magnitude: string | null
          surprise_score: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          actual_num?: number | null
          actual_raw?: string | null
          category?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          dedupe_hash?: string | null
          event_date?: string | null
          event_datetime_utc?: string | null
          event_impact?: string | null
          event_name: string
          event_status?: string | null
          event_time_raw?: string | null
          event_type?: string | null
          event_url?: string | null
          forecast_num?: number | null
          forecast_raw?: string | null
          id?: number
          importance?: string | null
          importance_score?: number | null
          indicator_code?: string | null
          notes?: string | null
          previous_num?: number | null
          previous_raw?: string | null
          raw_payload?: Json | null
          reference_period?: string | null
          region?: string | null
          revised_num?: number | null
          revised_raw?: string | null
          source_event_id?: string | null
          source_name?: string | null
          source_provider?: string
          source_url?: string | null
          subcategory?: string | null
          surprise_direction?: string | null
          surprise_magnitude?: string | null
          surprise_score?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_num?: number | null
          actual_raw?: string | null
          category?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          dedupe_hash?: string | null
          event_date?: string | null
          event_datetime_utc?: string | null
          event_impact?: string | null
          event_name?: string
          event_status?: string | null
          event_time_raw?: string | null
          event_type?: string | null
          event_url?: string | null
          forecast_num?: number | null
          forecast_raw?: string | null
          id?: number
          importance?: string | null
          importance_score?: number | null
          indicator_code?: string | null
          notes?: string | null
          previous_num?: number | null
          previous_raw?: string | null
          raw_payload?: Json | null
          reference_period?: string | null
          region?: string | null
          revised_num?: number | null
          revised_raw?: string | null
          source_event_id?: string | null
          source_name?: string | null
          source_provider?: string
          source_url?: string | null
          subcategory?: string | null
          surprise_direction?: string | null
          surprise_magnitude?: string | null
          surprise_score?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      macro_event_reactions: {
        Row: {
          actual_value: string | null
          analyst_note: string | null
          created_at: string | null
          data_source: string | null
          dominant_reaction: string | null
          dxy_d0: number | null
          dxy_d1_chg: number | null
          dxy_d21_chg: number | null
          dxy_d3_chg: number | null
          dxy_d5_chg: number | null
          equity_reaction_summary: string | null
          event_category: string
          event_country: string
          event_date: string
          event_name: string
          event_region: string | null
          event_subcategory: string | null
          expected_value: string | null
          fx_reaction_summary: string | null
          gold_d0: number | null
          gold_d1_chg: number | null
          gold_d21_chg: number | null
          gold_d3_chg: number | null
          gold_d5_chg: number | null
          id: number
          indicator_type: string | null
          macro_regime: string | null
          market_surprise: string | null
          oil_d0: number | null
          oil_d1_chg: number | null
          oil_d21_chg: number | null
          oil_d3_chg: number | null
          oil_d5_chg: number | null
          previous_value: string | null
          rates_reaction_summary: string | null
          report_analysis_id: number | null
          risk_sentiment: string | null
          spx_d0: number | null
          spx_d1_chg: number | null
          spx_d21_chg: number | null
          spx_d3_chg: number | null
          spx_d5_chg: number | null
          surprise_direction: string | null
          surprise_magnitude: string | null
          us10y_d0: number | null
          us10y_d1_chg: number | null
          us10y_d21_chg: number | null
          us10y_d3_chg: number | null
          us10y_d5_chg: number | null
          us2y_d0: number | null
          us2y_d1_chg: number | null
          us2y_d21_chg: number | null
          us2y_d3_chg: number | null
          us2y_d5_chg: number | null
          usdeur_d0: number | null
          usdeur_d1_chg: number | null
          usdeur_d21_chg: number | null
          usdeur_d3_chg: number | null
          usdeur_d5_chg: number | null
          usdjpy_d0: number | null
          usdjpy_d1_chg: number | null
          usdjpy_d21_chg: number | null
          usdjpy_d3_chg: number | null
          usdjpy_d5_chg: number | null
          vix_d0: number | null
          vix_d1_chg: number | null
          vix_d21_chg: number | null
          vix_d3_chg: number | null
          vix_d5_chg: number | null
          was_priced_in: boolean | null
        }
        Insert: {
          actual_value?: string | null
          analyst_note?: string | null
          created_at?: string | null
          data_source?: string | null
          dominant_reaction?: string | null
          dxy_d0?: number | null
          dxy_d1_chg?: number | null
          dxy_d21_chg?: number | null
          dxy_d3_chg?: number | null
          dxy_d5_chg?: number | null
          equity_reaction_summary?: string | null
          event_category: string
          event_country: string
          event_date: string
          event_name: string
          event_region?: string | null
          event_subcategory?: string | null
          expected_value?: string | null
          fx_reaction_summary?: string | null
          gold_d0?: number | null
          gold_d1_chg?: number | null
          gold_d21_chg?: number | null
          gold_d3_chg?: number | null
          gold_d5_chg?: number | null
          id?: number
          indicator_type?: string | null
          macro_regime?: string | null
          market_surprise?: string | null
          oil_d0?: number | null
          oil_d1_chg?: number | null
          oil_d21_chg?: number | null
          oil_d3_chg?: number | null
          oil_d5_chg?: number | null
          previous_value?: string | null
          rates_reaction_summary?: string | null
          report_analysis_id?: number | null
          risk_sentiment?: string | null
          spx_d0?: number | null
          spx_d1_chg?: number | null
          spx_d21_chg?: number | null
          spx_d3_chg?: number | null
          spx_d5_chg?: number | null
          surprise_direction?: string | null
          surprise_magnitude?: string | null
          us10y_d0?: number | null
          us10y_d1_chg?: number | null
          us10y_d21_chg?: number | null
          us10y_d3_chg?: number | null
          us10y_d5_chg?: number | null
          us2y_d0?: number | null
          us2y_d1_chg?: number | null
          us2y_d21_chg?: number | null
          us2y_d3_chg?: number | null
          us2y_d5_chg?: number | null
          usdeur_d0?: number | null
          usdeur_d1_chg?: number | null
          usdeur_d21_chg?: number | null
          usdeur_d3_chg?: number | null
          usdeur_d5_chg?: number | null
          usdjpy_d0?: number | null
          usdjpy_d1_chg?: number | null
          usdjpy_d21_chg?: number | null
          usdjpy_d3_chg?: number | null
          usdjpy_d5_chg?: number | null
          vix_d0?: number | null
          vix_d1_chg?: number | null
          vix_d21_chg?: number | null
          vix_d3_chg?: number | null
          vix_d5_chg?: number | null
          was_priced_in?: boolean | null
        }
        Update: {
          actual_value?: string | null
          analyst_note?: string | null
          created_at?: string | null
          data_source?: string | null
          dominant_reaction?: string | null
          dxy_d0?: number | null
          dxy_d1_chg?: number | null
          dxy_d21_chg?: number | null
          dxy_d3_chg?: number | null
          dxy_d5_chg?: number | null
          equity_reaction_summary?: string | null
          event_category?: string
          event_country?: string
          event_date?: string
          event_name?: string
          event_region?: string | null
          event_subcategory?: string | null
          expected_value?: string | null
          fx_reaction_summary?: string | null
          gold_d0?: number | null
          gold_d1_chg?: number | null
          gold_d21_chg?: number | null
          gold_d3_chg?: number | null
          gold_d5_chg?: number | null
          id?: number
          indicator_type?: string | null
          macro_regime?: string | null
          market_surprise?: string | null
          oil_d0?: number | null
          oil_d1_chg?: number | null
          oil_d21_chg?: number | null
          oil_d3_chg?: number | null
          oil_d5_chg?: number | null
          previous_value?: string | null
          rates_reaction_summary?: string | null
          report_analysis_id?: number | null
          risk_sentiment?: string | null
          spx_d0?: number | null
          spx_d1_chg?: number | null
          spx_d21_chg?: number | null
          spx_d3_chg?: number | null
          spx_d5_chg?: number | null
          surprise_direction?: string | null
          surprise_magnitude?: string | null
          us10y_d0?: number | null
          us10y_d1_chg?: number | null
          us10y_d21_chg?: number | null
          us10y_d3_chg?: number | null
          us10y_d5_chg?: number | null
          us2y_d0?: number | null
          us2y_d1_chg?: number | null
          us2y_d21_chg?: number | null
          us2y_d3_chg?: number | null
          us2y_d5_chg?: number | null
          usdeur_d0?: number | null
          usdeur_d1_chg?: number | null
          usdeur_d21_chg?: number | null
          usdeur_d3_chg?: number | null
          usdeur_d5_chg?: number | null
          usdjpy_d0?: number | null
          usdjpy_d1_chg?: number | null
          usdjpy_d21_chg?: number | null
          usdjpy_d3_chg?: number | null
          usdjpy_d5_chg?: number | null
          vix_d0?: number | null
          vix_d1_chg?: number | null
          vix_d21_chg?: number | null
          vix_d3_chg?: number | null
          vix_d5_chg?: number | null
          was_priced_in?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "macro_event_reactions_report_analysis_id_fkey"
            columns: ["report_analysis_id"]
            isOneToOne: false
            referencedRelation: "report_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "macro_event_reactions_report_analysis_id_fkey"
            columns: ["report_analysis_id"]
            isOneToOne: false
            referencedRelation: "v_reports_with_source"
            referencedColumns: ["id"]
          },
        ]
      }
      macro_events_calendar: {
        Row: {
          actual_value: number | null
          consensus: number | null
          created_at: string | null
          dxy_reaction: string | null
          equity_reaction: string | null
          event_currency: string | null
          event_date: string | null
          event_datetime: string | null
          event_group: string | null
          event_impact: string | null
          event_importance: string | null
          event_name: string | null
          event_status: string | null
          event_type: string | null
          expected_value: number | null
          fx_reaction: string | null
          gold_reaction: string | null
          id: number
          importance_score: number | null
          indicator_group: string | null
          interpretation: string | null
          market_impact_narrative: string | null
          message: string | null
          notes: string | null
          oil_reaction: string | null
          previous_value: number | null
          region: string | null
          release_status: string | null
          report_id: number | null
          revision: string | null
          subcategory: string | null
          surprise_color: string | null
          surprise_direction: string | null
          surprise_magnitude: string | null
          surprise_score: number | null
          yields_reaction: string | null
        }
        Insert: {
          actual_value?: number | null
          consensus?: number | null
          created_at?: string | null
          dxy_reaction?: string | null
          equity_reaction?: string | null
          event_currency?: string | null
          event_date?: string | null
          event_datetime?: string | null
          event_group?: string | null
          event_impact?: string | null
          event_importance?: string | null
          event_name?: string | null
          event_status?: string | null
          event_type?: string | null
          expected_value?: number | null
          fx_reaction?: string | null
          gold_reaction?: string | null
          id?: never
          importance_score?: number | null
          indicator_group?: string | null
          interpretation?: string | null
          market_impact_narrative?: string | null
          message?: string | null
          notes?: string | null
          oil_reaction?: string | null
          previous_value?: number | null
          region?: string | null
          release_status?: string | null
          report_id?: number | null
          revision?: string | null
          subcategory?: string | null
          surprise_color?: string | null
          surprise_direction?: string | null
          surprise_magnitude?: string | null
          surprise_score?: number | null
          yields_reaction?: string | null
        }
        Update: {
          actual_value?: number | null
          consensus?: number | null
          created_at?: string | null
          dxy_reaction?: string | null
          equity_reaction?: string | null
          event_currency?: string | null
          event_date?: string | null
          event_datetime?: string | null
          event_group?: string | null
          event_impact?: string | null
          event_importance?: string | null
          event_name?: string | null
          event_status?: string | null
          event_type?: string | null
          expected_value?: number | null
          fx_reaction?: string | null
          gold_reaction?: string | null
          id?: never
          importance_score?: number | null
          indicator_group?: string | null
          interpretation?: string | null
          market_impact_narrative?: string | null
          message?: string | null
          notes?: string | null
          oil_reaction?: string | null
          previous_value?: number | null
          region?: string | null
          release_status?: string | null
          report_id?: number | null
          revision?: string | null
          subcategory?: string | null
          surprise_color?: string | null
          surprise_direction?: string | null
          surprise_magnitude?: string | null
          surprise_score?: number | null
          yields_reaction?: string | null
        }
        Relationships: []
      }
      macro_news_events: {
        Row: {
          article_url: string | null
          category: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          dedupe_hash: string | null
          headline: string
          id: number
          impact_level: string | null
          published_at_utc: string | null
          published_date: string | null
          raw_payload: Json | null
          region: string | null
          sentiment_label: string | null
          sentiment_score: number | null
          source_name: string | null
          source_news_id: string | null
          source_provider: string
          source_url: string | null
          summary: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          article_url?: string | null
          category?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          dedupe_hash?: string | null
          headline: string
          id?: number
          impact_level?: string | null
          published_at_utc?: string | null
          published_date?: string | null
          raw_payload?: Json | null
          region?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          source_name?: string | null
          source_news_id?: string | null
          source_provider?: string
          source_url?: string | null
          summary?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          article_url?: string | null
          category?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          dedupe_hash?: string | null
          headline?: string
          id?: number
          impact_level?: string | null
          published_at_utc?: string | null
          published_date?: string | null
          raw_payload?: Json | null
          region?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          source_name?: string | null
          source_news_id?: string | null
          source_provider?: string
          source_url?: string | null
          summary?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      market_data_live: {
        Row: {
          audusd: number | null
          bbb_spread: number | null
          btcusd: number | null
          copper: number | null
          credit_regime: string | null
          dji: number | null
          dxy: number | null
          dxy_trade_weighted: number | null
          eurusd: number | null
          fetch_date: string
          fetched_at: string | null
          gbpusd: number | null
          gold: number | null
          gold_real_yield_note: string | null
          hy_spread: number | null
          id: number
          natgas: number | null
          ndx: number | null
          notes: string | null
          nzdusd: number | null
          oil_brent: number | null
          oil_wti: number | null
          silver: number | null
          source: string | null
          spx: number | null
          usdcad: number | null
          usdchf: number | null
          usdjpy: number | null
          vix: number | null
          vix_regime: string | null
          vix_term_structure: string | null
        }
        Insert: {
          audusd?: number | null
          bbb_spread?: number | null
          btcusd?: number | null
          copper?: number | null
          credit_regime?: string | null
          dji?: number | null
          dxy?: number | null
          dxy_trade_weighted?: number | null
          eurusd?: number | null
          fetch_date: string
          fetched_at?: string | null
          gbpusd?: number | null
          gold?: number | null
          gold_real_yield_note?: string | null
          hy_spread?: number | null
          id?: never
          natgas?: number | null
          ndx?: number | null
          notes?: string | null
          nzdusd?: number | null
          oil_brent?: number | null
          oil_wti?: number | null
          silver?: number | null
          source?: string | null
          spx?: number | null
          usdcad?: number | null
          usdchf?: number | null
          usdjpy?: number | null
          vix?: number | null
          vix_regime?: string | null
          vix_term_structure?: string | null
        }
        Update: {
          audusd?: number | null
          bbb_spread?: number | null
          btcusd?: number | null
          copper?: number | null
          credit_regime?: string | null
          dji?: number | null
          dxy?: number | null
          dxy_trade_weighted?: number | null
          eurusd?: number | null
          fetch_date?: string
          fetched_at?: string | null
          gbpusd?: number | null
          gold?: number | null
          gold_real_yield_note?: string | null
          hy_spread?: number | null
          id?: never
          natgas?: number | null
          ndx?: number | null
          notes?: string | null
          nzdusd?: number | null
          oil_brent?: number | null
          oil_wti?: number | null
          silver?: number | null
          source?: string | null
          spx?: number | null
          usdcad?: number | null
          usdchf?: number | null
          usdjpy?: number | null
          vix?: number | null
          vix_regime?: string | null
          vix_term_structure?: string | null
        }
        Relationships: []
      }
      period_snapshots: {
        Row: {
          aud_bias: string | null
          biggest_shifts: string | null
          cad_bias: string | null
          capital_rotation: string | null
          cb_boe_direction: string | null
          cb_boe_stance: string | null
          cb_boj_direction: string | null
          cb_boj_stance: string | null
          cb_ecb_direction: string | null
          cb_ecb_stance: string | null
          cb_fed_direction: string | null
          cb_fed_stance: string | null
          cb_narrative: string | null
          central_bank_bias: string | null
          chf_bias: string | null
          conviction_score: number | null
          copper_view: string | null
          core_driver: string | null
          created_at: string | null
          curve_view: string | null
          divergence_themes: string | null
          dominant_flow: string | null
          eur_bias: string | null
          event_focus: string | null
          flow_chain: string | null
          gbp_bias: string | null
          gold_view: string | null
          growth_bias: string | null
          growth_narrative: string | null
          headline: string | null
          high_conviction_next_month: string | null
          id: number
          inflation_bias: string | null
          inflation_narrative: string | null
          jpy_bias: string | null
          key_developments: string | null
          liquidity_bias: string | null
          liquidity_regime: string | null
          macro_regime: string | null
          market_sensitivity_summary: string | null
          nasdaq_view: string | null
          natgas_view: string | null
          next_watchpoints: string | null
          next_week_focus: string | null
          nzd_bias: string | null
          oil_view: string | null
          period_end: string
          period_label: string | null
          period_start: string
          period_type: string
          priced_in_assessment: string | null
          qe_qt_overview: string | null
          real_yield_view: string | null
          risk_on_off_bias: string | null
          risk_regime: string | null
          risk_sentiment: string | null
          scenario_base: string | null
          scenario_downside: string | null
          scenario_upside: string | null
          silver_view: string | null
          spx_view: string | null
          strongest_theme: string | null
          structural_changes: string | null
          summary: string | null
          summary_dashboard: string | null
          summary_micro: string | null
          trading_implications: string | null
          us_10y_view: string | null
          us_2y_view: string | null
          usd_bias: string | null
          vix_view: string | null
          weakest_theme: string | null
          what_changed: string | null
          what_to_watch: string | null
          what_to_watch_next: string | null
          yield_narrative: string | null
          yield_signal: string | null
        }
        Insert: {
          aud_bias?: string | null
          biggest_shifts?: string | null
          cad_bias?: string | null
          capital_rotation?: string | null
          cb_boe_direction?: string | null
          cb_boe_stance?: string | null
          cb_boj_direction?: string | null
          cb_boj_stance?: string | null
          cb_ecb_direction?: string | null
          cb_ecb_stance?: string | null
          cb_fed_direction?: string | null
          cb_fed_stance?: string | null
          cb_narrative?: string | null
          central_bank_bias?: string | null
          chf_bias?: string | null
          conviction_score?: number | null
          copper_view?: string | null
          core_driver?: string | null
          created_at?: string | null
          curve_view?: string | null
          divergence_themes?: string | null
          dominant_flow?: string | null
          eur_bias?: string | null
          event_focus?: string | null
          flow_chain?: string | null
          gbp_bias?: string | null
          gold_view?: string | null
          growth_bias?: string | null
          growth_narrative?: string | null
          headline?: string | null
          high_conviction_next_month?: string | null
          id?: number
          inflation_bias?: string | null
          inflation_narrative?: string | null
          jpy_bias?: string | null
          key_developments?: string | null
          liquidity_bias?: string | null
          liquidity_regime?: string | null
          macro_regime?: string | null
          market_sensitivity_summary?: string | null
          nasdaq_view?: string | null
          natgas_view?: string | null
          next_watchpoints?: string | null
          next_week_focus?: string | null
          nzd_bias?: string | null
          oil_view?: string | null
          period_end: string
          period_label?: string | null
          period_start: string
          period_type: string
          priced_in_assessment?: string | null
          qe_qt_overview?: string | null
          real_yield_view?: string | null
          risk_on_off_bias?: string | null
          risk_regime?: string | null
          risk_sentiment?: string | null
          scenario_base?: string | null
          scenario_downside?: string | null
          scenario_upside?: string | null
          silver_view?: string | null
          spx_view?: string | null
          strongest_theme?: string | null
          structural_changes?: string | null
          summary?: string | null
          summary_dashboard?: string | null
          summary_micro?: string | null
          trading_implications?: string | null
          us_10y_view?: string | null
          us_2y_view?: string | null
          usd_bias?: string | null
          vix_view?: string | null
          weakest_theme?: string | null
          what_changed?: string | null
          what_to_watch?: string | null
          what_to_watch_next?: string | null
          yield_narrative?: string | null
          yield_signal?: string | null
        }
        Update: {
          aud_bias?: string | null
          biggest_shifts?: string | null
          cad_bias?: string | null
          capital_rotation?: string | null
          cb_boe_direction?: string | null
          cb_boe_stance?: string | null
          cb_boj_direction?: string | null
          cb_boj_stance?: string | null
          cb_ecb_direction?: string | null
          cb_ecb_stance?: string | null
          cb_fed_direction?: string | null
          cb_fed_stance?: string | null
          cb_narrative?: string | null
          central_bank_bias?: string | null
          chf_bias?: string | null
          conviction_score?: number | null
          copper_view?: string | null
          core_driver?: string | null
          created_at?: string | null
          curve_view?: string | null
          divergence_themes?: string | null
          dominant_flow?: string | null
          eur_bias?: string | null
          event_focus?: string | null
          flow_chain?: string | null
          gbp_bias?: string | null
          gold_view?: string | null
          growth_bias?: string | null
          growth_narrative?: string | null
          headline?: string | null
          high_conviction_next_month?: string | null
          id?: number
          inflation_bias?: string | null
          inflation_narrative?: string | null
          jpy_bias?: string | null
          key_developments?: string | null
          liquidity_bias?: string | null
          liquidity_regime?: string | null
          macro_regime?: string | null
          market_sensitivity_summary?: string | null
          nasdaq_view?: string | null
          natgas_view?: string | null
          next_watchpoints?: string | null
          next_week_focus?: string | null
          nzd_bias?: string | null
          oil_view?: string | null
          period_end?: string
          period_label?: string | null
          period_start?: string
          period_type?: string
          priced_in_assessment?: string | null
          qe_qt_overview?: string | null
          real_yield_view?: string | null
          risk_on_off_bias?: string | null
          risk_regime?: string | null
          risk_sentiment?: string | null
          scenario_base?: string | null
          scenario_downside?: string | null
          scenario_upside?: string | null
          silver_view?: string | null
          spx_view?: string | null
          strongest_theme?: string | null
          structural_changes?: string | null
          summary?: string | null
          summary_dashboard?: string | null
          summary_micro?: string | null
          trading_implications?: string | null
          us_10y_view?: string | null
          us_2y_view?: string | null
          usd_bias?: string | null
          vix_view?: string | null
          weakest_theme?: string | null
          what_changed?: string | null
          what_to_watch?: string | null
          what_to_watch_next?: string | null
          yield_narrative?: string | null
          yield_signal?: string | null
        }
        Relationships: []
      }
      raw_reports: {
        Row: {
          created_at: string | null
          drive_file_id: string | null
          drive_link: string | null
          file_name: string | null
          id: number
          language: string | null
          raw_text: string | null
          report_date: string
          report_type: string | null
          source: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          drive_file_id?: string | null
          drive_link?: string | null
          file_name?: string | null
          id?: number
          language?: string | null
          raw_text?: string | null
          report_date: string
          report_type?: string | null
          source?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          drive_file_id?: string | null
          drive_link?: string | null
          file_name?: string | null
          id?: number
          language?: string | null
          raw_text?: string | null
          report_date?: string
          report_type?: string | null
          source?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: []
      }
      report_analysis: {
        Row: {
          analysis_date: string | null
          aud_bias: string | null
          aud_reason: string | null
          bias_shift: string | null
          cad_bias: string | null
          cad_reason: string | null
          cb_boe_communication: string | null
          cb_boe_direction: string | null
          cb_boe_qe_qt: string | null
          cb_boe_stance: string | null
          cb_boj_communication: string | null
          cb_boj_direction: string | null
          cb_boj_qe_qt: string | null
          cb_boj_stance: string | null
          cb_ecb_communication: string | null
          cb_ecb_direction: string | null
          cb_ecb_qe_qt: string | null
          cb_ecb_stance: string | null
          cb_fed_communication: string | null
          cb_fed_direction: string | null
          cb_fed_qe_qt: string | null
          cb_fed_stance: string | null
          cb_narrative: string | null
          cb_policy_bias: string | null
          chf_bias: string | null
          chf_reason: string | null
          cny_bias: string | null
          cny_reason: string | null
          commodity_analysis: string | null
          confidence_score: number | null
          copper_bias: string | null
          copper_reason: string | null
          core_driver: string | null
          created_at: string | null
          cross_currency_view: string | null
          currency_deep_analysis: string | null
          de10y_bias: string | null
          de10y_reason: string | null
          de2y_bias: string | null
          de2y_reason: string | null
          dow_bias: string | null
          dow_reason: string | null
          driver_subcategory: string | null
          driver_type: string | null
          equity_risk_view: string | null
          eur_bias: string | null
          eur_reason: string | null
          eurostoxx_bias: string | null
          eurostoxx_reason: string | null
          flow_asset_response: string | null
          flow_chain: string | null
          flow_chain_summary: string | null
          flow_mechanism: string | null
          flow_timing: string | null
          flow_transmission: string | null
          flow_trigger: string | null
          forward_implications: string | null
          gas_bias: string | null
          gas_reason: string | null
          gbp_bias: string | null
          gbp_reason: string | null
          gold_bias: string | null
          gold_reason: string | null
          growth_bias: string | null
          id: number
          important_for_today: string | null
          important_this_month: string | null
          important_this_week: string | null
          important_this_week_detail: string | null
          important_today: string | null
          inflation_bias: string | null
          invalidation_conditions: string | null
          jp10y_bias: string | null
          jp10y_reason: string | null
          jpy_bias: string | null
          jpy_reason: string | null
          key_levels: string | null
          key_points: string | null
          key_watchpoints: string | null
          language_original: string | null
          language_output: string | null
          liquidity_bias: string | null
          liquidity_regime: string | null
          macro_regime: string | null
          main_theme: string | null
          market_data_id: number | null
          market_sensitivity: string | null
          model_version: string | null
          nasdaq_bias: string | null
          nasdaq_reason: string | null
          nikkei_bias: string | null
          nikkei_reason: string | null
          nzd_bias: string | null
          nzd_reason: string | null
          oil_bias: string | null
          oil_reason: string | null
          pass1_completed_at: string | null
          pass1_status: string | null
          pass2_completed_at: string | null
          pass2_status: string | null
          priced_in: string | null
          priced_in_assessment: string | null
          qe_qt_overview: string | null
          raw_report_id: number | null
          regime_subcategory: string | null
          retry_count: number | null
          risk_regime: string | null
          risk_sentiment: string | null
          scenario_base: string | null
          scenario_downside: string | null
          scenario_probabilities: string | null
          scenario_upside: string | null
          shock_type: string | null
          silver_bias: string | null
          silver_reason: string | null
          spx_bias: string | null
          spx_reason: string | null
          status: string | null
          summary_dashboard: string | null
          summary_detailed: string | null
          summary_full: string | null
          summary_micro: string | null
          summary_short: string | null
          summary_ultra_short: string | null
          term_premium_narrative: string | null
          timing_window: string | null
          title: string | null
          trading_implications: string | null
          transmission_mechanism: string | null
          trigger_levels: string | null
          uk10y_bias: string | null
          uk10y_reason: string | null
          uk2y_bias: string | null
          uk2y_reason: string | null
          us10y_bias: string | null
          us10y_reason: string | null
          us2y_bias: string | null
          us2y_reason: string | null
          usd_bias: string | null
          usd_reason: string | null
          validation_status: string | null
          what_breaks_the_view: string | null
          what_changed: string | null
          what_stands_out: string | null
          what_to_watch_next: string | null
          why_it_matters: string | null
          workflow_version: string | null
          yield_analysis: string | null
          yield_curve_narrative: string | null
          yield_differentials_view: string | null
          yield_fx_implication: string | null
          yield_signal: string | null
        }
        Insert: {
          analysis_date?: string | null
          aud_bias?: string | null
          aud_reason?: string | null
          bias_shift?: string | null
          cad_bias?: string | null
          cad_reason?: string | null
          cb_boe_communication?: string | null
          cb_boe_direction?: string | null
          cb_boe_qe_qt?: string | null
          cb_boe_stance?: string | null
          cb_boj_communication?: string | null
          cb_boj_direction?: string | null
          cb_boj_qe_qt?: string | null
          cb_boj_stance?: string | null
          cb_ecb_communication?: string | null
          cb_ecb_direction?: string | null
          cb_ecb_qe_qt?: string | null
          cb_ecb_stance?: string | null
          cb_fed_communication?: string | null
          cb_fed_direction?: string | null
          cb_fed_qe_qt?: string | null
          cb_fed_stance?: string | null
          cb_narrative?: string | null
          cb_policy_bias?: string | null
          chf_bias?: string | null
          chf_reason?: string | null
          cny_bias?: string | null
          cny_reason?: string | null
          commodity_analysis?: string | null
          confidence_score?: number | null
          copper_bias?: string | null
          copper_reason?: string | null
          core_driver?: string | null
          created_at?: string | null
          cross_currency_view?: string | null
          currency_deep_analysis?: string | null
          de10y_bias?: string | null
          de10y_reason?: string | null
          de2y_bias?: string | null
          de2y_reason?: string | null
          dow_bias?: string | null
          dow_reason?: string | null
          driver_subcategory?: string | null
          driver_type?: string | null
          equity_risk_view?: string | null
          eur_bias?: string | null
          eur_reason?: string | null
          eurostoxx_bias?: string | null
          eurostoxx_reason?: string | null
          flow_asset_response?: string | null
          flow_chain?: string | null
          flow_chain_summary?: string | null
          flow_mechanism?: string | null
          flow_timing?: string | null
          flow_transmission?: string | null
          flow_trigger?: string | null
          forward_implications?: string | null
          gas_bias?: string | null
          gas_reason?: string | null
          gbp_bias?: string | null
          gbp_reason?: string | null
          gold_bias?: string | null
          gold_reason?: string | null
          growth_bias?: string | null
          id?: number
          important_for_today?: string | null
          important_this_month?: string | null
          important_this_week?: string | null
          important_this_week_detail?: string | null
          important_today?: string | null
          inflation_bias?: string | null
          invalidation_conditions?: string | null
          jp10y_bias?: string | null
          jp10y_reason?: string | null
          jpy_bias?: string | null
          jpy_reason?: string | null
          key_levels?: string | null
          key_points?: string | null
          key_watchpoints?: string | null
          language_original?: string | null
          language_output?: string | null
          liquidity_bias?: string | null
          liquidity_regime?: string | null
          macro_regime?: string | null
          main_theme?: string | null
          market_data_id?: number | null
          market_sensitivity?: string | null
          model_version?: string | null
          nasdaq_bias?: string | null
          nasdaq_reason?: string | null
          nikkei_bias?: string | null
          nikkei_reason?: string | null
          nzd_bias?: string | null
          nzd_reason?: string | null
          oil_bias?: string | null
          oil_reason?: string | null
          pass1_completed_at?: string | null
          pass1_status?: string | null
          pass2_completed_at?: string | null
          pass2_status?: string | null
          priced_in?: string | null
          priced_in_assessment?: string | null
          qe_qt_overview?: string | null
          raw_report_id?: number | null
          regime_subcategory?: string | null
          retry_count?: number | null
          risk_regime?: string | null
          risk_sentiment?: string | null
          scenario_base?: string | null
          scenario_downside?: string | null
          scenario_probabilities?: string | null
          scenario_upside?: string | null
          shock_type?: string | null
          silver_bias?: string | null
          silver_reason?: string | null
          spx_bias?: string | null
          spx_reason?: string | null
          status?: string | null
          summary_dashboard?: string | null
          summary_detailed?: string | null
          summary_full?: string | null
          summary_micro?: string | null
          summary_short?: string | null
          summary_ultra_short?: string | null
          term_premium_narrative?: string | null
          timing_window?: string | null
          title?: string | null
          trading_implications?: string | null
          transmission_mechanism?: string | null
          trigger_levels?: string | null
          uk10y_bias?: string | null
          uk10y_reason?: string | null
          uk2y_bias?: string | null
          uk2y_reason?: string | null
          us10y_bias?: string | null
          us10y_reason?: string | null
          us2y_bias?: string | null
          us2y_reason?: string | null
          usd_bias?: string | null
          usd_reason?: string | null
          validation_status?: string | null
          what_breaks_the_view?: string | null
          what_changed?: string | null
          what_stands_out?: string | null
          what_to_watch_next?: string | null
          why_it_matters?: string | null
          workflow_version?: string | null
          yield_analysis?: string | null
          yield_curve_narrative?: string | null
          yield_differentials_view?: string | null
          yield_fx_implication?: string | null
          yield_signal?: string | null
        }
        Update: {
          analysis_date?: string | null
          aud_bias?: string | null
          aud_reason?: string | null
          bias_shift?: string | null
          cad_bias?: string | null
          cad_reason?: string | null
          cb_boe_communication?: string | null
          cb_boe_direction?: string | null
          cb_boe_qe_qt?: string | null
          cb_boe_stance?: string | null
          cb_boj_communication?: string | null
          cb_boj_direction?: string | null
          cb_boj_qe_qt?: string | null
          cb_boj_stance?: string | null
          cb_ecb_communication?: string | null
          cb_ecb_direction?: string | null
          cb_ecb_qe_qt?: string | null
          cb_ecb_stance?: string | null
          cb_fed_communication?: string | null
          cb_fed_direction?: string | null
          cb_fed_qe_qt?: string | null
          cb_fed_stance?: string | null
          cb_narrative?: string | null
          cb_policy_bias?: string | null
          chf_bias?: string | null
          chf_reason?: string | null
          cny_bias?: string | null
          cny_reason?: string | null
          commodity_analysis?: string | null
          confidence_score?: number | null
          copper_bias?: string | null
          copper_reason?: string | null
          core_driver?: string | null
          created_at?: string | null
          cross_currency_view?: string | null
          currency_deep_analysis?: string | null
          de10y_bias?: string | null
          de10y_reason?: string | null
          de2y_bias?: string | null
          de2y_reason?: string | null
          dow_bias?: string | null
          dow_reason?: string | null
          driver_subcategory?: string | null
          driver_type?: string | null
          equity_risk_view?: string | null
          eur_bias?: string | null
          eur_reason?: string | null
          eurostoxx_bias?: string | null
          eurostoxx_reason?: string | null
          flow_asset_response?: string | null
          flow_chain?: string | null
          flow_chain_summary?: string | null
          flow_mechanism?: string | null
          flow_timing?: string | null
          flow_transmission?: string | null
          flow_trigger?: string | null
          forward_implications?: string | null
          gas_bias?: string | null
          gas_reason?: string | null
          gbp_bias?: string | null
          gbp_reason?: string | null
          gold_bias?: string | null
          gold_reason?: string | null
          growth_bias?: string | null
          id?: number
          important_for_today?: string | null
          important_this_month?: string | null
          important_this_week?: string | null
          important_this_week_detail?: string | null
          important_today?: string | null
          inflation_bias?: string | null
          invalidation_conditions?: string | null
          jp10y_bias?: string | null
          jp10y_reason?: string | null
          jpy_bias?: string | null
          jpy_reason?: string | null
          key_levels?: string | null
          key_points?: string | null
          key_watchpoints?: string | null
          language_original?: string | null
          language_output?: string | null
          liquidity_bias?: string | null
          liquidity_regime?: string | null
          macro_regime?: string | null
          main_theme?: string | null
          market_data_id?: number | null
          market_sensitivity?: string | null
          model_version?: string | null
          nasdaq_bias?: string | null
          nasdaq_reason?: string | null
          nikkei_bias?: string | null
          nikkei_reason?: string | null
          nzd_bias?: string | null
          nzd_reason?: string | null
          oil_bias?: string | null
          oil_reason?: string | null
          pass1_completed_at?: string | null
          pass1_status?: string | null
          pass2_completed_at?: string | null
          pass2_status?: string | null
          priced_in?: string | null
          priced_in_assessment?: string | null
          qe_qt_overview?: string | null
          raw_report_id?: number | null
          regime_subcategory?: string | null
          retry_count?: number | null
          risk_regime?: string | null
          risk_sentiment?: string | null
          scenario_base?: string | null
          scenario_downside?: string | null
          scenario_probabilities?: string | null
          scenario_upside?: string | null
          shock_type?: string | null
          silver_bias?: string | null
          silver_reason?: string | null
          spx_bias?: string | null
          spx_reason?: string | null
          status?: string | null
          summary_dashboard?: string | null
          summary_detailed?: string | null
          summary_full?: string | null
          summary_micro?: string | null
          summary_short?: string | null
          summary_ultra_short?: string | null
          term_premium_narrative?: string | null
          timing_window?: string | null
          title?: string | null
          trading_implications?: string | null
          transmission_mechanism?: string | null
          trigger_levels?: string | null
          uk10y_bias?: string | null
          uk10y_reason?: string | null
          uk2y_bias?: string | null
          uk2y_reason?: string | null
          us10y_bias?: string | null
          us10y_reason?: string | null
          us2y_bias?: string | null
          us2y_reason?: string | null
          usd_bias?: string | null
          usd_reason?: string | null
          validation_status?: string | null
          what_breaks_the_view?: string | null
          what_changed?: string | null
          what_stands_out?: string | null
          what_to_watch_next?: string | null
          why_it_matters?: string | null
          workflow_version?: string | null
          yield_analysis?: string | null
          yield_curve_narrative?: string | null
          yield_differentials_view?: string | null
          yield_fx_implication?: string | null
          yield_signal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_analysis_raw_report_id_fkey"
            columns: ["raw_report_id"]
            isOneToOne: false
            referencedRelation: "raw_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_trade_ideas: {
        Row: {
          asset: string
          asset_class: string | null
          bias: string | null
          conviction: number | null
          created_at: string | null
          direction: string | null
          entry_rationale: string | null
          id: number
          invalidation: string | null
          main_driver: string | null
          note: string | null
          raw_report_id: number | null
          report_analysis_id: number | null
          snap_date: string | null
          status: string | null
          stop_rationale: string | null
          target: string | null
          timing: string | null
          transmission: string | null
        }
        Insert: {
          asset: string
          asset_class?: string | null
          bias?: string | null
          conviction?: number | null
          created_at?: string | null
          direction?: string | null
          entry_rationale?: string | null
          id?: number
          invalidation?: string | null
          main_driver?: string | null
          note?: string | null
          raw_report_id?: number | null
          report_analysis_id?: number | null
          snap_date?: string | null
          status?: string | null
          stop_rationale?: string | null
          target?: string | null
          timing?: string | null
          transmission?: string | null
        }
        Update: {
          asset?: string
          asset_class?: string | null
          bias?: string | null
          conviction?: number | null
          created_at?: string | null
          direction?: string | null
          entry_rationale?: string | null
          id?: number
          invalidation?: string | null
          main_driver?: string | null
          note?: string | null
          raw_report_id?: number | null
          report_analysis_id?: number | null
          snap_date?: string | null
          status?: string | null
          stop_rationale?: string | null
          target?: string | null
          timing?: string | null
          transmission?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_trade_ideas_report_analysis_id_fkey"
            columns: ["report_analysis_id"]
            isOneToOne: false
            referencedRelation: "report_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_trade_ideas_report_analysis_id_fkey"
            columns: ["report_analysis_id"]
            isOneToOne: false
            referencedRelation: "v_reports_with_source"
            referencedColumns: ["id"]
          },
        ]
      }
      yields_live: {
        Row: {
          aud_10y: number | null
          aud_2s10s: number | null
          aud_2y: number | null
          breakeven_10y: number | null
          breakeven_5y: number | null
          cad_10y: number | null
          cad_2s10s: number | null
          cad_2y: number | null
          chf_10y: number | null
          chf_2s10s: number | null
          chf_2y: number | null
          curve_change_1d: number | null
          curve_interpretation: string | null
          curve_regime: string | null
          curve_signal: string | null
          diff_aud_10y: number | null
          diff_cad_10y: number | null
          diff_chf_10y: number | null
          diff_eur_10y: number | null
          diff_gbp_10y: number | null
          diff_jpy_10y: number | null
          diff_nzd_10y: number | null
          eur_10y: number | null
          eur_2s10s: number | null
          eur_2y: number | null
          eur_30y: number | null
          eur_5y: number | null
          fedfunds: number | null
          fetch_date: string
          fetched_at: string | null
          front_end_move: number | null
          gbp_10y: number | null
          gbp_2s10s: number | null
          gbp_2y: number | null
          gbp_30y: number | null
          id: number
          implied_breakeven_10y: number | null
          jpy_10y: number | null
          jpy_2s10s: number | null
          jpy_2y: number | null
          jpy_30y: number | null
          long_end_move: number | null
          nzd_10y: number | null
          nzd_2s10s: number | null
          nzd_2y: number | null
          source: string | null
          us_10y: number | null
          us_10y_change: number | null
          us_10y_prev: number | null
          us_10y3m: number | null
          us_2s10s: number | null
          us_2y: number | null
          us_2y_change: number | null
          us_2y_prev: number | null
          us_30y: number | null
          us_3m: number | null
          us_3m10y: number | null
          us_5y: number | null
          us_real_10y: number | null
          us_real_5y: number | null
          us_real_yield_10y: number | null
        }
        Insert: {
          aud_10y?: number | null
          aud_2s10s?: number | null
          aud_2y?: number | null
          breakeven_10y?: number | null
          breakeven_5y?: number | null
          cad_10y?: number | null
          cad_2s10s?: number | null
          cad_2y?: number | null
          chf_10y?: number | null
          chf_2s10s?: number | null
          chf_2y?: number | null
          curve_change_1d?: number | null
          curve_interpretation?: string | null
          curve_regime?: string | null
          curve_signal?: string | null
          diff_aud_10y?: number | null
          diff_cad_10y?: number | null
          diff_chf_10y?: number | null
          diff_eur_10y?: number | null
          diff_gbp_10y?: number | null
          diff_jpy_10y?: number | null
          diff_nzd_10y?: number | null
          eur_10y?: number | null
          eur_2s10s?: number | null
          eur_2y?: number | null
          eur_30y?: number | null
          eur_5y?: number | null
          fedfunds?: number | null
          fetch_date: string
          fetched_at?: string | null
          front_end_move?: number | null
          gbp_10y?: number | null
          gbp_2s10s?: number | null
          gbp_2y?: number | null
          gbp_30y?: number | null
          id?: number
          implied_breakeven_10y?: number | null
          jpy_10y?: number | null
          jpy_2s10s?: number | null
          jpy_2y?: number | null
          jpy_30y?: number | null
          long_end_move?: number | null
          nzd_10y?: number | null
          nzd_2s10s?: number | null
          nzd_2y?: number | null
          source?: string | null
          us_10y?: number | null
          us_10y_change?: number | null
          us_10y_prev?: number | null
          us_10y3m?: number | null
          us_2s10s?: number | null
          us_2y?: number | null
          us_2y_change?: number | null
          us_2y_prev?: number | null
          us_30y?: number | null
          us_3m?: number | null
          us_3m10y?: number | null
          us_5y?: number | null
          us_real_10y?: number | null
          us_real_5y?: number | null
          us_real_yield_10y?: number | null
        }
        Update: {
          aud_10y?: number | null
          aud_2s10s?: number | null
          aud_2y?: number | null
          breakeven_10y?: number | null
          breakeven_5y?: number | null
          cad_10y?: number | null
          cad_2s10s?: number | null
          cad_2y?: number | null
          chf_10y?: number | null
          chf_2s10s?: number | null
          chf_2y?: number | null
          curve_change_1d?: number | null
          curve_interpretation?: string | null
          curve_regime?: string | null
          curve_signal?: string | null
          diff_aud_10y?: number | null
          diff_cad_10y?: number | null
          diff_chf_10y?: number | null
          diff_eur_10y?: number | null
          diff_gbp_10y?: number | null
          diff_jpy_10y?: number | null
          diff_nzd_10y?: number | null
          eur_10y?: number | null
          eur_2s10s?: number | null
          eur_2y?: number | null
          eur_30y?: number | null
          eur_5y?: number | null
          fedfunds?: number | null
          fetch_date?: string
          fetched_at?: string | null
          front_end_move?: number | null
          gbp_10y?: number | null
          gbp_2s10s?: number | null
          gbp_2y?: number | null
          gbp_30y?: number | null
          id?: number
          implied_breakeven_10y?: number | null
          jpy_10y?: number | null
          jpy_2s10s?: number | null
          jpy_2y?: number | null
          jpy_30y?: number | null
          long_end_move?: number | null
          nzd_10y?: number | null
          nzd_2s10s?: number | null
          nzd_2y?: number | null
          source?: string | null
          us_10y?: number | null
          us_10y_change?: number | null
          us_10y_prev?: number | null
          us_10y3m?: number | null
          us_2s10s?: number | null
          us_2y?: number | null
          us_2y_change?: number | null
          us_2y_prev?: number | null
          us_30y?: number | null
          us_3m?: number | null
          us_3m10y?: number | null
          us_5y?: number | null
          us_real_10y?: number | null
          us_real_5y?: number | null
          us_real_yield_10y?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      currency_yields_snapshot: {
        Row: {
          currency_code: string | null
          diff_vs_usd: number | null
          fetch_date: string | null
          policy_rate: number | null
          spread_2s10s: number | null
          yield_10y: number | null
          yield_2y: number | null
          yield_30y: number | null
          yield_5y: number | null
        }
        Relationships: []
      }
      daily_macro_drivers: {
        Row: {
          aud_bias: string | null
          cad_bias: string | null
          cb_ecb_stance: string | null
          cb_fed_stance: string | null
          chf_bias: string | null
          core_driver: string | null
          eur_bias: string | null
          flow_chain: string | null
          gbp_bias: string | null
          growth_bias: string | null
          headline: string | null
          inflation_bias: string | null
          jpy_bias: string | null
          macro_regime: string | null
          nzd_bias: string | null
          report_date: string | null
          risk_on_off_bias: string | null
          summary_dashboard: string | null
          summary_micro: string | null
          trading_implications: string | null
          usd_bias: string | null
          yield_signal: string | null
        }
        Insert: {
          aud_bias?: string | null
          cad_bias?: string | null
          cb_ecb_stance?: string | null
          cb_fed_stance?: string | null
          chf_bias?: string | null
          core_driver?: string | null
          eur_bias?: string | null
          flow_chain?: string | null
          gbp_bias?: string | null
          growth_bias?: string | null
          headline?: string | null
          inflation_bias?: string | null
          jpy_bias?: string | null
          macro_regime?: string | null
          nzd_bias?: string | null
          report_date?: string | null
          risk_on_off_bias?: string | null
          summary_dashboard?: string | null
          summary_micro?: string | null
          trading_implications?: string | null
          usd_bias?: string | null
          yield_signal?: string | null
        }
        Update: {
          aud_bias?: string | null
          cad_bias?: string | null
          cb_ecb_stance?: string | null
          cb_fed_stance?: string | null
          chf_bias?: string | null
          core_driver?: string | null
          eur_bias?: string | null
          flow_chain?: string | null
          gbp_bias?: string | null
          growth_bias?: string | null
          headline?: string | null
          inflation_bias?: string | null
          jpy_bias?: string | null
          macro_regime?: string | null
          nzd_bias?: string | null
          report_date?: string | null
          risk_on_off_bias?: string | null
          summary_dashboard?: string | null
          summary_micro?: string | null
          trading_implications?: string | null
          usd_bias?: string | null
          yield_signal?: string | null
        }
        Relationships: []
      }
      fx_consensus: {
        Row: {
          bearish_count: number | null
          bullish_count: number | null
          consensus_bias: string | null
          conviction_pct: number | null
          entity_code: string | null
          neutral_count: number | null
          top_driver: string | null
          total_count: number | null
        }
        Relationships: []
      }
      latest_currency_macro: {
        Row: {
          bias: string | null
          cb_expectation: string | null
          cb_now: string | null
          confidence: string | null
          created_at: string | null
          currency_code: string | null
          flows_impact: string | null
          global_snapshot_id: number | null
          growth_expectation: string | null
          growth_now: string | null
          id: number | null
          important_for_today: string | null
          inflation_expectation: string | null
          inflation_now: string | null
          invalidation_risk: string | null
          liquidity_conditions: string | null
          liquidity_impact: string | null
          main_driver: string | null
          market_pricing: string | null
          overall_score: number | null
          positioning: string | null
          rate_differential: string | null
          score_cb: number | null
          score_flows: number | null
          score_growth: number | null
          score_inflation: number | null
          score_liquidity: number | null
          sensitivity: string | null
          snapshot_date: string | null
          summary_detailed: string | null
          summary_short: string | null
          what_to_watch_next: string | null
          yields_now: string | null
        }
        Relationships: []
      }
      macro_dashboard_clean: {
        Row: {
          category: string | null
          currency_code: string | null
          frequency: string | null
          indicator_key: string | null
          indicator_name: string | null
          latest: number | null
          latest_date: string | null
          mean_7c: number | null
          source: string | null
          t_minus_1: number | null
          t_minus_2: number | null
          t_minus_3: number | null
          t_minus_4: number | null
          t_minus_5: number | null
          t_minus_6: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          currency_code?: string | null
          frequency?: string | null
          indicator_key?: string | null
          indicator_name?: string | null
          latest?: number | null
          latest_date?: string | null
          mean_7c?: number | null
          source?: string | null
          t_minus_1?: number | null
          t_minus_2?: number | null
          t_minus_3?: number | null
          t_minus_4?: number | null
          t_minus_5?: number | null
          t_minus_6?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          currency_code?: string | null
          frequency?: string | null
          indicator_key?: string | null
          indicator_name?: string | null
          latest?: number | null
          latest_date?: string | null
          mean_7c?: number | null
          source?: string | null
          t_minus_1?: number | null
          t_minus_2?: number | null
          t_minus_3?: number | null
          t_minus_4?: number | null
          t_minus_5?: number | null
          t_minus_6?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      overview_cockpit: {
        Row: {
          alignment_date: string | null
          alignment_state: string | null
          aud_bias: string | null
          aud_view: string | null
          cad_bias: string | null
          cad_view: string | null
          cb_boe_stance: string | null
          cb_boj_stance: string | null
          cb_ecb_stance: string | null
          cb_fed_stance: string | null
          chf_bias: string | null
          chf_view: string | null
          commodity_view: string | null
          conflicts: string | null
          conviction_score: number | null
          core_driver: string | null
          currency_ranking: string | null
          currency_view: string | null
          curve_view: string | null
          daily_date: string | null
          daily_gold_view: string | null
          daily_oil_view: string | null
          daily_spx_view: string | null
          daily_summary_dashboard: string | null
          daily_summary_micro: string | null
          daily_trading_implications: string | null
          daily_vs_weekly: string | null
          equity_view: string | null
          eur_bias: string | null
          eur_view: string | null
          flow_chain: string | null
          gbp_bias: string | null
          gbp_view: string | null
          gold_view: string | null
          growth_bias: string | null
          headline: string | null
          high_conviction_assets: string | null
          inflation_bias: string | null
          jpy_bias: string | null
          jpy_view: string | null
          key_watchpoints: string | null
          liquidity_regime: string | null
          low_conviction_assets: string | null
          macro_regime: string | null
          macro_story: string | null
          nzd_bias: string | null
          nzd_view: string | null
          oil_view: string | null
          rates_view: string | null
          real_yield_view: string | null
          report_date: string | null
          risk_on_off_bias: string | null
          risk_regime: string | null
          risk_sentiment: string | null
          scenario_base: string | null
          scenario_downside: string | null
          scenario_upside: string | null
          spx_view: string | null
          summary: string | null
          summary_dashboard: string | null
          summary_micro: string | null
          trading_implications: string | null
          us_10y_view: string | null
          us_2y_view: string | null
          usd_bias: string | null
          usd_view: string | null
          vix_view: string | null
          weekly_vs_monthly: string | null
          what_to_avoid: string | null
          what_to_do: string | null
          what_to_watch: string | null
          yield_signal: string | null
        }
        Relationships: []
      }
      overview_market_snapshot: {
        Row: {
          audusd: number | null
          breakeven_10y: number | null
          copper: number | null
          credit_regime: string | null
          curve_regime: string | null
          dji: number | null
          dxy: number | null
          dxy_trade_weighted: number | null
          eurusd: number | null
          fetch_date: string | null
          gbpusd: number | null
          gold: number | null
          hy_spread: number | null
          natgas: number | null
          ndx: number | null
          oil_brent: number | null
          oil_wti: number | null
          report_date: string | null
          silver: number | null
          spx: number | null
          us_10y: number | null
          us_2s10s: number | null
          us_2y: number | null
          us_real_10y: number | null
          usdjpy: number | null
          vix: number | null
          vix_regime: string | null
        }
        Relationships: []
      }
      v_dwm_currency_bias: {
        Row: {
          aud_bias: string | null
          cad_bias: string | null
          chf_bias: string | null
          eur_bias: string | null
          gbp_bias: string | null
          growth_bias: string | null
          inflation_bias: string | null
          jpy_bias: string | null
          nzd_bias: string | null
          period_label: string | null
          period_start: string | null
          period_type: string | null
          risk_on_off_bias: string | null
          usd_bias: string | null
        }
        Insert: {
          aud_bias?: string | null
          cad_bias?: string | null
          chf_bias?: string | null
          eur_bias?: string | null
          gbp_bias?: string | null
          growth_bias?: string | null
          inflation_bias?: string | null
          jpy_bias?: string | null
          nzd_bias?: string | null
          period_label?: string | null
          period_start?: string | null
          period_type?: string | null
          risk_on_off_bias?: string | null
          usd_bias?: string | null
        }
        Update: {
          aud_bias?: string | null
          cad_bias?: string | null
          chf_bias?: string | null
          eur_bias?: string | null
          gbp_bias?: string | null
          growth_bias?: string | null
          inflation_bias?: string | null
          jpy_bias?: string | null
          nzd_bias?: string | null
          period_label?: string | null
          period_start?: string | null
          period_type?: string | null
          risk_on_off_bias?: string | null
          usd_bias?: string | null
        }
        Relationships: []
      }
      v_fx_currency_ranking: {
        Row: {
          bias: string | null
          bias_score: number | null
          carry_bias: string | null
          cb_direction: string | null
          cb_stance: string | null
          composite_score: number | null
          confidence: string | null
          confidence_weight: number | null
          currency_code: string | null
          currency_macro_regime: string | null
          currency_risk_regime: string | null
          currency_yield_regime: string | null
          higher_tf_bias: string | null
          important_for_today: string | null
          invalidation_risk: string | null
          main_driver: string | null
          medium_term_bias: string | null
          overall_score: number | null
          rank_position: number | null
          rate_diff_vs_usd: string | null
          score_cb: number | null
          score_flows: number | null
          score_growth: number | null
          score_inflation: number | null
          score_liquidity: number | null
          short_term_bias: string | null
          snapshot_date: string | null
          summary_short: string | null
          what_to_watch_next: string | null
        }
        Relationships: []
      }
      v_latest_alignment: {
        Row: {
          alignment_date: string | null
          alignment_state: string | null
          aud_view: string | null
          cad_view: string | null
          cb_alignment_narrative: string | null
          cb_view: string | null
          chf_view: string | null
          commodity_view: string | null
          conflicts: string | null
          conviction_score: number | null
          core_driver: string | null
          created_at: string | null
          currency_ranking: string | null
          currency_view: string | null
          curve_view: string | null
          daily_aud: string | null
          daily_cad: string | null
          daily_cb: string | null
          daily_chf: string | null
          daily_conviction: number | null
          daily_driver: string | null
          daily_eur: string | null
          daily_gbp: string | null
          daily_growth: string | null
          daily_headline: string | null
          daily_inflation: string | null
          daily_jpy: string | null
          daily_label: string | null
          daily_liquidity: string | null
          daily_nzd: string | null
          daily_regime: string | null
          daily_risk: string | null
          daily_snapshot_id: number | null
          daily_usd: string | null
          daily_vs_weekly: string | null
          equity_view: string | null
          eur_view: string | null
          flow_chain: string | null
          gbp_view: string | null
          gold_view: string | null
          growth_alignment: string | null
          growth_view: string | null
          high_conviction_assets: string | null
          id: number | null
          inflation_alignment: string | null
          inflation_view: string | null
          jpy_view: string | null
          key_watchpoints: string | null
          liquidity_alignment: string | null
          liquidity_regime: string | null
          liquidity_view: string | null
          low_conviction_assets: string | null
          macro_regime: string | null
          macro_story: string | null
          monthly_conviction: number | null
          monthly_eur: string | null
          monthly_gbp: string | null
          monthly_growth: string | null
          monthly_headline: string | null
          monthly_inflation: string | null
          monthly_jpy: string | null
          monthly_label: string | null
          monthly_regime: string | null
          monthly_risk: string | null
          monthly_snapshot_id: number | null
          monthly_usd: string | null
          nzd_view: string | null
          oil_view: string | null
          priced_in_assessment: string | null
          rates_view: string | null
          real_yield_view: string | null
          risk_regime: string | null
          risk_sentiment: string | null
          scenario_base: string | null
          scenario_downside: string | null
          scenario_upside: string | null
          spx_view: string | null
          summary: string | null
          summary_dashboard: string | null
          summary_micro: string | null
          trading_implications: string | null
          transmission_summary: string | null
          us_10y_view: string | null
          us_2y_view: string | null
          usd_view: string | null
          vix_view: string | null
          weekly_conviction: number | null
          weekly_eur: string | null
          weekly_gbp: string | null
          weekly_growth: string | null
          weekly_headline: string | null
          weekly_inflation: string | null
          weekly_jpy: string | null
          weekly_label: string | null
          weekly_regime: string | null
          weekly_risk: string | null
          weekly_snapshot_id: number | null
          weekly_usd: string | null
          weekly_vs_monthly: string | null
          what_to_avoid: string | null
          what_to_do: string | null
          yield_signal_summary: string | null
          yield_view: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alignment_engine_daily_snapshot_id_fkey"
            columns: ["daily_snapshot_id"]
            isOneToOne: false
            referencedRelation: "period_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignment_engine_daily_snapshot_id_fkey"
            columns: ["daily_snapshot_id"]
            isOneToOne: false
            referencedRelation: "v_latest_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignment_engine_monthly_snapshot_id_fkey"
            columns: ["monthly_snapshot_id"]
            isOneToOne: false
            referencedRelation: "period_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignment_engine_monthly_snapshot_id_fkey"
            columns: ["monthly_snapshot_id"]
            isOneToOne: false
            referencedRelation: "v_latest_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignment_engine_weekly_snapshot_id_fkey"
            columns: ["weekly_snapshot_id"]
            isOneToOne: false
            referencedRelation: "period_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignment_engine_weekly_snapshot_id_fkey"
            columns: ["weekly_snapshot_id"]
            isOneToOne: false
            referencedRelation: "v_latest_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      v_latest_snapshots: {
        Row: {
          aud_bias: string | null
          cad_bias: string | null
          cb_boe_direction: string | null
          cb_boe_stance: string | null
          cb_boj_direction: string | null
          cb_boj_stance: string | null
          cb_ecb_direction: string | null
          cb_ecb_stance: string | null
          cb_fed_direction: string | null
          cb_fed_stance: string | null
          cb_narrative: string | null
          central_bank_bias: string | null
          chf_bias: string | null
          conviction_score: number | null
          core_driver: string | null
          created_at: string | null
          eur_bias: string | null
          event_focus: string | null
          flow_chain: string | null
          gbp_bias: string | null
          growth_bias: string | null
          growth_narrative: string | null
          headline: string | null
          id: number | null
          inflation_bias: string | null
          inflation_narrative: string | null
          jpy_bias: string | null
          key_developments: string | null
          liquidity_bias: string | null
          liquidity_regime: string | null
          macro_regime: string | null
          market_sensitivity_summary: string | null
          next_watchpoints: string | null
          nzd_bias: string | null
          period_end: string | null
          period_label: string | null
          period_start: string | null
          period_type: string | null
          priced_in_assessment: string | null
          qe_qt_overview: string | null
          risk_on_off_bias: string | null
          risk_regime: string | null
          risk_sentiment: string | null
          scenario_base: string | null
          scenario_downside: string | null
          scenario_upside: string | null
          summary: string | null
          trading_implications: string | null
          usd_bias: string | null
          what_changed: string | null
          what_to_watch_next: string | null
          yield_narrative: string | null
          yield_signal: string | null
        }
        Relationships: []
      }
      v_macro_dashboard: {
        Row: {
          category: string | null
          cb_projections_updated: string | null
          country_code: string | null
          fred_series_id: string | null
          frequency: string | null
          gdp_forecast: number | null
          indicator_key: string | null
          indicator_name: string | null
          inflation_target: number | null
          latest: number | null
          latest_date: string | null
          mean_7c: number | null
          policy_rate: number | null
          projection_year: string | null
          regime: string | null
          source: string | null
          t_minus_1: number | null
          t_minus_2: number | null
          t_minus_3: number | null
          t_minus_4: number | null
          t_minus_5: number | null
          t_minus_6: number | null
          unemployment_forecast: number | null
          unit: string | null
        }
        Relationships: []
      }
      v_reports_with_source: {
        Row: {
          analysis_date: string | null
          cb_boe_direction: string | null
          cb_boe_stance: string | null
          cb_boj_direction: string | null
          cb_boj_stance: string | null
          cb_ecb_direction: string | null
          cb_ecb_stance: string | null
          cb_fed_direction: string | null
          cb_fed_stance: string | null
          confidence_score: number | null
          core_driver: string | null
          driver_type: string | null
          file_name: string | null
          flow_chain: string | null
          growth_bias: string | null
          id: number | null
          inflation_bias: string | null
          key_points: string | null
          key_watchpoints: string | null
          liquidity_bias: string | null
          macro_regime: string | null
          market_sensitivity: string | null
          priced_in_assessment: string | null
          report_type: string | null
          risk_regime: string | null
          risk_sentiment: string | null
          scenario_base: string | null
          scenario_downside: string | null
          scenario_upside: string | null
          shock_type: string | null
          source: string | null
          summary_detailed: string | null
          summary_short: string | null
          title: string | null
          trading_implications: string | null
          transmission_mechanism: string | null
          what_changed: string | null
          why_it_matters: string | null
          yield_curve_narrative: string | null
        }
        Relationships: []
      }
      v_yield_pattern_intelligence: {
        Row: {
          aud_10y: number | null
          aud_2s10s: number | null
          aud_2y: number | null
          aud_fx_implication: string | null
          aud_spread_vs_usd: number | null
          aud_yield_pattern: string | null
          breakeven_10y: number | null
          cad_10y: number | null
          cad_2s10s: number | null
          cad_2y: number | null
          cad_fx_implication: string | null
          cad_spread_vs_usd: number | null
          cad_yield_pattern: string | null
          chf_10y: number | null
          chf_2s10s: number | null
          chf_2y: number | null
          chf_fx_implication: string | null
          chf_spread_vs_usd: number | null
          curve_interpretation: string | null
          curve_regime: string | null
          curve_signal: string | null
          diff_aud_10y: number | null
          diff_cad_10y: number | null
          diff_chf_10y: number | null
          diff_eur_10y: number | null
          diff_gbp_10y: number | null
          diff_jpy_10y: number | null
          diff_nzd_10y: number | null
          eur_10y: number | null
          eur_2s10s: number | null
          eur_2y: number | null
          eur_30y: number | null
          eur_5y: number | null
          eur_fx_implication: string | null
          eur_spread_vs_usd: number | null
          eur_yield_pattern: string | null
          fedfunds: number | null
          fetch_date: string | null
          gbp_10y: number | null
          gbp_2s10s: number | null
          gbp_2y: number | null
          gbp_30y: number | null
          gbp_fx_implication: string | null
          gbp_spread_vs_usd: number | null
          gbp_yield_pattern: string | null
          jpy_10y: number | null
          jpy_2s10s: number | null
          jpy_2y: number | null
          jpy_30y: number | null
          jpy_fx_implication: string | null
          jpy_spread_vs_usd: number | null
          jpy_yield_pattern: string | null
          nzd_10y: number | null
          nzd_2s10s: number | null
          nzd_2y: number | null
          nzd_spread_vs_usd: number | null
          us_10y: number | null
          us_2s10s: number | null
          us_2y: number | null
          us_30y: number | null
          us_3m10y: number | null
          us_5y: number | null
          us_real_yield_10y: number | null
        }
        Relationships: []
      }
      yield_curve_regime: {
        Row: {
          aud_10y: number | null
          aud_2s10s: number | null
          aud_2y: number | null
          breakeven_10y: number | null
          breakeven_5y: number | null
          cad_10y: number | null
          cad_2s10s: number | null
          cad_2y: number | null
          chf_10y: number | null
          chf_2s10s: number | null
          chf_2y: number | null
          computed_curve_regime: string | null
          curve_change_1d: number | null
          curve_interpretation: string | null
          curve_regime: string | null
          curve_signal: string | null
          diff_aud_10y: number | null
          diff_cad_10y: number | null
          diff_chf_10y: number | null
          diff_eur_10y: number | null
          diff_gbp_10y: number | null
          diff_jpy_10y: number | null
          diff_nzd_10y: number | null
          eur_10y: number | null
          eur_2s10s: number | null
          eur_2y: number | null
          eur_30y: number | null
          eur_5y: number | null
          fedfunds: number | null
          fetch_date: string | null
          fetched_at: string | null
          front_end_move: number | null
          gbp_10y: number | null
          gbp_2s10s: number | null
          gbp_2y: number | null
          gbp_30y: number | null
          id: number | null
          implied_breakeven_10y: number | null
          jpy_10y: number | null
          jpy_2s10s: number | null
          jpy_2y: number | null
          jpy_30y: number | null
          long_end_move: number | null
          nzd_10y: number | null
          nzd_2s10s: number | null
          nzd_2y: number | null
          regime_interpretation: string | null
          source: string | null
          us_10y: number | null
          us_10y_change: number | null
          us_10y_prev: number | null
          us_10y3m: number | null
          us_2s10s: number | null
          us_2y: number | null
          us_2y_change: number | null
          us_2y_prev: number | null
          us_30y: number | null
          us_3m: number | null
          us_3m10y: number | null
          us_5y: number | null
          us_real_10y: number | null
          us_real_5y: number | null
          us_real_yield_10y: number | null
        }
        Insert: {
          aud_10y?: number | null
          aud_2s10s?: number | null
          aud_2y?: number | null
          breakeven_10y?: number | null
          breakeven_5y?: number | null
          cad_10y?: number | null
          cad_2s10s?: number | null
          cad_2y?: number | null
          chf_10y?: number | null
          chf_2s10s?: number | null
          chf_2y?: number | null
          computed_curve_regime?: never
          curve_change_1d?: number | null
          curve_interpretation?: string | null
          curve_regime?: string | null
          curve_signal?: string | null
          diff_aud_10y?: number | null
          diff_cad_10y?: number | null
          diff_chf_10y?: number | null
          diff_eur_10y?: number | null
          diff_gbp_10y?: number | null
          diff_jpy_10y?: number | null
          diff_nzd_10y?: number | null
          eur_10y?: number | null
          eur_2s10s?: number | null
          eur_2y?: number | null
          eur_30y?: number | null
          eur_5y?: number | null
          fedfunds?: number | null
          fetch_date?: string | null
          fetched_at?: string | null
          front_end_move?: number | null
          gbp_10y?: number | null
          gbp_2s10s?: number | null
          gbp_2y?: number | null
          gbp_30y?: number | null
          id?: number | null
          implied_breakeven_10y?: number | null
          jpy_10y?: number | null
          jpy_2s10s?: number | null
          jpy_2y?: number | null
          jpy_30y?: number | null
          long_end_move?: number | null
          nzd_10y?: number | null
          nzd_2s10s?: number | null
          nzd_2y?: number | null
          regime_interpretation?: never
          source?: string | null
          us_10y?: number | null
          us_10y_change?: number | null
          us_10y_prev?: number | null
          us_10y3m?: number | null
          us_2s10s?: number | null
          us_2y?: number | null
          us_2y_change?: number | null
          us_2y_prev?: number | null
          us_30y?: number | null
          us_3m?: number | null
          us_3m10y?: number | null
          us_5y?: number | null
          us_real_10y?: number | null
          us_real_5y?: number | null
          us_real_yield_10y?: number | null
        }
        Update: {
          aud_10y?: number | null
          aud_2s10s?: number | null
          aud_2y?: number | null
          breakeven_10y?: number | null
          breakeven_5y?: number | null
          cad_10y?: number | null
          cad_2s10s?: number | null
          cad_2y?: number | null
          chf_10y?: number | null
          chf_2s10s?: number | null
          chf_2y?: number | null
          computed_curve_regime?: never
          curve_change_1d?: number | null
          curve_interpretation?: string | null
          curve_regime?: string | null
          curve_signal?: string | null
          diff_aud_10y?: number | null
          diff_cad_10y?: number | null
          diff_chf_10y?: number | null
          diff_eur_10y?: number | null
          diff_gbp_10y?: number | null
          diff_jpy_10y?: number | null
          diff_nzd_10y?: number | null
          eur_10y?: number | null
          eur_2s10s?: number | null
          eur_2y?: number | null
          eur_30y?: number | null
          eur_5y?: number | null
          fedfunds?: number | null
          fetch_date?: string | null
          fetched_at?: string | null
          front_end_move?: number | null
          gbp_10y?: number | null
          gbp_2s10s?: number | null
          gbp_2y?: number | null
          gbp_30y?: number | null
          id?: number | null
          implied_breakeven_10y?: number | null
          jpy_10y?: number | null
          jpy_2s10s?: number | null
          jpy_2y?: number | null
          jpy_30y?: number | null
          long_end_move?: number | null
          nzd_10y?: number | null
          nzd_2s10s?: number | null
          nzd_2y?: number | null
          regime_interpretation?: never
          source?: string | null
          us_10y?: number | null
          us_10y_change?: number | null
          us_10y_prev?: number | null
          us_10y3m?: number | null
          us_2s10s?: number | null
          us_2y?: number | null
          us_2y_change?: number | null
          us_2y_prev?: number | null
          us_30y?: number | null
          us_3m?: number | null
          us_3m10y?: number | null
          us_5y?: number | null
          us_real_10y?: number | null
          us_real_5y?: number | null
          us_real_yield_10y?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_complete_schema: { Args: never; Returns: Json }
      save_period_snapshot: { Args: { payload: Json }; Returns: Json }
      update_market_dxy_dji: {
        Args: { p_dji: number; p_dxy: number }
        Returns: undefined
      }
      upsert_period_snapshot: {
        Args: {
          p_data: Json
          p_period_end: string
          p_period_label: string
          p_period_start: string
          p_period_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
