# Partner Sync API Contract

## Scope

This document defines the server-side HTTP contract for the partner sync module used by the Rihea frontend.

- Module: `partner-sync`
- Version: `v1`
- Updated: `2026-03-10`

## Response Envelope

All remote responses should use the same envelope:

```json
{
  "code": "OK",
  "message": "success",
  "requestId": "req_20260310_xxx",
  "data": {}
}
```

Error example:

```json
{
  "code": "PARTNER_INVITE_EXPIRED",
  "message": "Invite code has expired",
  "requestId": "req_20260310_xxx",
  "data": null
}
```

## Common Enums

### `PartnerSyncStatus`

- `disabled`
- `pending`
- `bound`

### `PartnerSharingLevel`

- `off`
- `summary`
- `summary_plus`

## 1. Get Overview

- Method: `GET`
- Path: `/v1/partner-sync/overview`

### Response `data`

```json
{
  "pairId": "pair_001",
  "status": "bound",
  "owner": {
    "userId": "user_owner_001",
    "nickname": "Yiting",
    "pregnancyWeek": "24+3",
    "dueDate": "2026-06-08"
  },
  "partner": {
    "userId": "user_partner_001",
    "nickname": "Alex",
    "relation": "伴侣",
    "joinedAt": "2026-03-10T08:00:00.000Z"
  },
  "invite": {
    "code": "K8P4MX",
    "expiresAt": "2026-03-17T08:00:00.000Z",
    "status": "pending"
  },
  "sharing": {
    "level": "summary_plus",
    "riskAlertsEnabled": true,
    "appointmentSyncEnabled": true,
    "taskSyncEnabled": true
  },
  "nextAppointment": {
    "id": "appt_001",
    "title": "产检复查",
    "dateTime": "2026-03-14T09:30:00.000Z",
    "location": "产科门诊"
  },
  "preview": {
    "sharedScope": "共享状态摘要、任务和产检准备",
    "todayStatus": {
      "checkedIn": true,
      "title": "今天更需要减负",
      "label": "紧绷",
      "desc": "优先帮她减少决策和今天的消耗。"
    },
    "risk": {
      "level": "medium",
      "label": "中等风险",
      "recommendation": "建议进行心理疏导，尝试放松练习，必要时咨询专业人士。",
      "notice": {
        "level": "medium",
        "title": "今天需要更多照顾",
        "desc": "今天请更主动一些，至少替她接走一件具体的事。"
      }
    },
    "tasks": [
      {
        "id": "reduce_load",
        "title": "替她拿走一件消耗的事",
        "desc": "今晚直接接手一件具体的事：吃饭、出行、资料或家务。",
        "meta": "15分钟",
        "done": false,
        "category": "care"
      }
    ],
    "communication": {
      "say": "今晚我先替你拿走一件消耗的事。",
      "avoid": "这也没什么大不了。",
      "ask": "你想让我先接手哪一件事？"
    }
  }
}
```

## 2. Get Home Card

- Method: `GET`
- Path: `/v1/partner-sync/home-card`

### Response `data`

```json
{
  "status": "bound",
  "sharing": {
    "level": "summary_plus"
  },
  "partner": {
    "userId": "user_partner_001",
    "nickname": "Alex",
    "relation": "伴侣"
  },
  "title": "伴侣今日行动",
  "desc": "优先帮她减少决策和今天的消耗。",
  "risk": {
    "level": "medium",
    "label": "中等风险",
    "notice": {
      "level": "medium",
      "title": "今天需要更多照顾",
      "desc": "今天请更主动一些，至少替她接走一件具体的事。"
    }
  },
  "mainTask": {
    "id": "reduce_load",
    "title": "替她拿走一件消耗的事",
    "desc": "今晚直接接手一件具体的事：吃饭、出行、资料或家务。",
    "meta": "15分钟",
    "done": false,
    "category": "care"
  },
  "appointment": {
    "id": "appt_001",
    "title": "产检复查",
    "dateTime": "2026-03-14T09:30:00.000Z",
    "location": "产科门诊"
  },
  "ctaLabel": "打开伴侣中心"
}
```

## 3. Create Invite

- Method: `POST`
- Path: `/v1/partner-sync/invite`

### Request Body

```json
{}
```

### Response `data`

```json
{
  "pairId": "pair_001",
  "status": "pending",
  "invite": {
    "code": "K8P4MX",
    "expiresAt": "2026-03-17T08:00:00.000Z",
    "status": "pending"
  },
  "sharing": {
    "level": "summary",
    "riskAlertsEnabled": true,
    "appointmentSyncEnabled": true,
    "taskSyncEnabled": true
  }
}
```

## 4. Confirm Binding

- Method: `POST`
- Path: `/v1/partner-sync/bind`

### Request Body

```json
{
  "partner": {
    "nickname": "Alex",
    "relation": "伴侣"
  },
  "sharing": {
    "level": "summary_plus"
  }
}
```

### Response `data`

```json
{
  "pairId": "pair_001",
  "status": "bound",
  "partner": {
    "userId": "user_partner_001",
    "nickname": "Alex",
    "relation": "伴侣",
    "joinedAt": "2026-03-10T08:00:00.000Z"
  },
  "sharing": {
    "level": "summary_plus",
    "riskAlertsEnabled": true,
    "appointmentSyncEnabled": true,
    "taskSyncEnabled": true
  }
}
```

## 5. Update Settings

- Method: `PATCH`
- Path: `/v1/partner-sync/settings`

### Request Body

```json
{
  "sharing": {
    "level": "summary_plus",
    "riskAlertsEnabled": true
  }
}
```

### Response `data`

```json
{
  "pairId": "pair_001",
  "status": "bound",
  "sharing": {
    "level": "summary_plus",
    "riskAlertsEnabled": true,
    "appointmentSyncEnabled": true,
    "taskSyncEnabled": true
  }
}
```

## 6. Update Task State

- Method: `PATCH`
- Path: `/v1/partner-sync/tasks`

### Request Body

```json
{
  "taskId": "reduce_load",
  "done": true
}
```

### Response `data`

```json
{
  "task": {
    "id": "reduce_load",
    "done": true,
    "updatedAt": "2026-03-10T08:10:00.000Z"
  }
}
```

## 7. Unbind

- Method: `POST`
- Path: `/v1/partner-sync/unbind`

### Request Body

```json
{}
```

### Response `data`

```json
{
  "pairId": null,
  "status": "disabled"
}
```

## Error Codes

- `PARTNER_INVITE_EXPIRED`
- `PARTNER_NOT_FOUND`
- `PARTNER_ALREADY_BOUND`
- `PARTNER_PERMISSION_DENIED`
- `PARTNER_TASK_NOT_FOUND`
- `PARTNER_INVALID_STATUS`
