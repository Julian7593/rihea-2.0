# Skill Platform V1

## Goal

The backend now has a unified Skill V1 layer that standardizes:

- manifest contracts
- input/output validation
- permission levels
- draft-only actions
- workflow composition
- execution traces

This is the first step from "built-in retrieval helpers" to a reusable agent skill ecosystem.

## Permission Model

- `read`
- `analyze`
- `write_draft`
- `write_execute`

Current rule:

- `write_draft` may generate `draft_effects`
- `write_execute` is blocked unless approval is explicitly present in execution context

## Capability Types

- `retrieval`
- `analysis`
- `action`
- `workflow`

## Current Built-in Skill Groups

### Retrieval

- `search_knowledge_base`
- `search_local_kb`
- `search_feishu_sync`
- `search_feishu_live`
- `search_web`
- `search_content_recommendations`
- profile/check-in/pregnancy context readers

### Analysis

- `assess_emotional_risk`
- `detect_danger_signals`
- `get_cbt_overview`
- `recommend_professional_help`
- `analyze_emotional_trends`
- `explain_risk_level`
- `analyze_nutrition_structure`
- `analyze_sleep_pattern`
- `analyze_meal_photo`

### Action

- `create_reminder_draft`
- `generate_support_plan_draft`
- `create_referral_draft`
- `record_user_state_draft`

### Workflow

- `grounded_consultation_workflow`
- `risk_escalation_workflow`
- `nutrition_followup_workflow`

## Execution APIs

Internal execution layer now supports:

- `registerSkill(manifest)`
- `discoverSkills(filters)`
- `executeSkill(name, input, context)`
- `executeWorkflow(name, input, context)`
- `requestApproval(payload)`

Compatibility path remains:

- `run(name, input, context)` returns legacy `{ ok, error, data }`

## Trace and Audit

Execution traces now include:

- `skillId`
- `workflowId`
- `capabilityType`
- `permissionLevel`
- `status`
- `approvalRequired`
- `approvalTicketId`
- `draftEffectsSummary`

This keeps the current orchestrator compatible while making traces suitable for future approval and workflow governance.
