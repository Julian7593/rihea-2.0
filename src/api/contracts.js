/**
 * API contract registry for profile/account/support modules.
 * Keep this file in sync with backend docs.
 */
export const apiContracts = {
  profile: {
    getOverview: {
      method: "GET",
      path: "/v1/profile/overview",
      responseShape: {
        name: "string",
        pregnancyWeek: "string",
        progress: "number",
        dueDate: "string",
        datingMethod: "dueDate|lmp|ivf?",
        lmpDate: "string?",
        cycleLength: "number?",
        ivfTransferDate: "string?",
        embryoAgeDays: "3|5?",
        riskLevel: "low|medium|high",
        partnerSync: "boolean",
      },
    },
    updateName: {
      method: "PATCH",
      path: "/v1/profile/name",
      requestShape: { name: "string" },
      responseShape: { name: "string" },
    },
    updateBasic: {
      method: "PATCH",
      path: "/v1/profile/basic",
      requestShape: {
        name: "string",
        dueDate: "string",
        pregnancyWeek: "string?",
        datingMethod: "dueDate|lmp|ivf?",
        lmpDate: "string?",
        cycleLength: "number?",
        ivfTransferDate: "string?",
        embryoAgeDays: "3|5?",
        city: "string?",
        phone: "string?",
        language: "zh|en?",
      },
      responseShape: {
        name: "string",
        dueDate: "string",
        pregnancyWeek: "string",
        datingMethod: "dueDate|lmp|ivf?",
        lmpDate: "string?",
        cycleLength: "number?",
        ivfTransferDate: "string?",
        embryoAgeDays: "3|5?",
        city: "string",
        phone: "string",
      },
    },
  },
  records: {
    getSummary: {
      method: "GET",
      path: "/v1/records/summary",
      responseShape: {
        monthCompletions: "number",
        comfortDoneRate: "number",
        latestMoodIndex: "number|null",
      },
    },
    getFetalMovementSummary: {
      method: "GET",
      path: "/v1/records/fetal-movements/summary",
      responseShape: {
        todayCount: "number",
        lastRecordedAt: "ISODateTime|null",
        status: "normal|need_attention|unknown",
      },
    },
    getFetalMovementRecords: {
      method: "GET",
      path: "/v1/records/fetal-movements",
      requestShape: {
        days: "number?",
      },
      responseShape: {
        records: "Array<{id:string,recordedAt:ISODateTime,source:string,weekLabel:string,note?:string}>",
      },
    },
    createFetalMovementRecord: {
      method: "POST",
      path: "/v1/records/fetal-movements",
      requestShape: {
        source: "home_card|detail_page|other",
        weekLabel: "string",
        note: "string?",
      },
      responseShape: {
        id: "string",
        recordedAt: "ISODateTime",
        todayCount: "number",
      },
    },
    updateFetalMovementRecord: {
      method: "PATCH",
      path: "/v1/records/fetal-movements/{id}",
      requestShape: {
        note: "string?",
      },
      responseShape: {
        id: "string",
        note: "string",
        updatedAt: "ISODateTime",
      },
    },
  },
  privacy: {
    getSettings: {
      method: "GET",
      path: "/v1/privacy/settings",
      responseShape: {
        privateMode: "boolean",
        shareForResearch: "boolean",
      },
    },
    updateSettings: {
      method: "PATCH",
      path: "/v1/privacy/settings",
      requestShape: {
        privateMode: "boolean?",
        shareForResearch: "boolean?",
      },
      responseShape: {
        privateMode: "boolean",
        shareForResearch: "boolean",
      },
    },
  },
  partner: {
    getOverview: {
      method: "GET",
      path: "/v1/partner-sync/overview",
      responseShape: {
        pairId: "string",
        status: "disabled|pending|bound",
        owner: "{userId:string,nickname:string,pregnancyWeek:string,dueDate:string}",
        partner: "{userId:string,nickname:string,relation:string,joinedAt:ISODateTime}|null",
        invite: "{code:string,expiresAt:ISODateTime,status:pending|used|expired}|null",
        sharing: "{level:off|summary|summary_plus,riskAlertsEnabled:boolean,appointmentSyncEnabled:boolean,taskSyncEnabled:boolean}",
        nextAppointment: "{id:string,title:string,dateTime:ISODateTime,location:string}",
        preview:
          "{sharedScope:string,todayStatus:{checkedIn:boolean,title:string,label:string,desc:string},risk:{level:string,label:string,recommendation:string,notice?:{level:string,title:string,desc:string}},tasks:Array<{id:string,title:string,desc:string,meta?:string,done:boolean,category?:string}>,communication:{say:string,avoid:string,ask:string}}",
      },
    },
    getHomeCard: {
      method: "GET",
      path: "/v1/partner-sync/home-card",
      responseShape: {
        status: "disabled|pending|bound",
        sharing: "{level:off|summary|summary_plus}",
        partner: "{userId:string,nickname:string,relation:string}|null",
        title: "string",
        desc: "string",
        risk: "{level:string,label:string,notice?:{level:string,title:string,desc:string}}",
        mainTask: "{id:string,title:string,desc:string,meta?:string,done?:boolean,category?:string}|null",
        appointment: "{id:string,title:string,dateTime:ISODateTime,location:string}|null",
        ctaLabel: "string",
      },
    },
    createInvite: {
      method: "POST",
      path: "/v1/partner-sync/invite",
      responseShape: {
        pairId: "string",
        status: "pending",
        invite: "{code:string,expiresAt:ISODateTime,status:pending}",
        sharing: "{level:summary|summary_plus,riskAlertsEnabled:boolean,appointmentSyncEnabled:boolean,taskSyncEnabled:boolean}",
      },
    },
    confirmBinding: {
      method: "POST",
      path: "/v1/partner-sync/bind",
      requestShape: {
        partner: "{nickname:string?,relation:string?}",
        sharing: "{level:summary|summary_plus?}",
      },
      responseShape: {
        pairId: "string",
        status: "bound",
        partner: "{userId:string,nickname:string,relation:string,joinedAt:ISODateTime}",
        sharing: "{level:summary|summary_plus,riskAlertsEnabled:boolean,appointmentSyncEnabled:boolean,taskSyncEnabled:boolean}",
      },
    },
    updateSettings: {
      method: "PATCH",
      path: "/v1/partner-sync/settings",
      requestShape: {
        sharing: "{level:off|summary|summary_plus?,riskAlertsEnabled:boolean?}",
      },
      responseShape: {
        pairId: "string",
        status: "disabled|pending|bound",
        sharing: "{level:off|summary|summary_plus,riskAlertsEnabled:boolean,appointmentSyncEnabled:boolean,taskSyncEnabled:boolean}",
      },
    },
    updateTaskState: {
      method: "PATCH",
      path: "/v1/partner-sync/tasks",
      requestShape: {
        taskId: "string",
        done: "boolean",
      },
      responseShape: {
        task: "{id:string,done:boolean,updatedAt:ISODateTime}",
      },
    },
    unbind: {
      method: "POST",
      path: "/v1/partner-sync/unbind",
      responseShape: {
        pairId: "null",
        status: "disabled",
      },
    },
  },
  cbt: {
    getOverview: {
      method: "GET",
      path: "/v1/cbt/overview",
      responseShape: {
        careLevel: "{code:string,label:string,desc:string,escalationCopy:string}",
        phase: "intake|active|reassessment_due|crisis",
        todayTask: "{id:string,title:string,desc:string,meta:string,status:string}",
        weeklyModule:
          "{id:string,weekNumber:number,title:string,summary:string,microPractice:{title:string,desc:string,durationLabel:string},partnerAction:{title:string,desc:string},homework?:object}",
        reassessmentDueAt: "ISODateTime|null",
        partnerTaskSummary: "{status:string,title:string,desc:string,helper:string}",
        careTeamStatus: "{status:string,referralRecommended:boolean,nextFollowUpAt:ISODateTime|null,lastActionAt:ISODateTime|null,channel:string,note:string,slots:Array<object>}",
        crisisState: "{active:boolean,level:string,title:string,desc:string,actions:Array<object>}",
      },
    },
    submitIntake: {
      method: "POST",
      path: "/v1/cbt/intake",
      requestShape: {
        epdsScore: "number",
        gad7Score: "number",
        isi7Score: "number",
        selfHarmRisk: "boolean",
        childbirthFear: "{uncertainty:number,painLossOfControl:number}",
        source: "self_report|clinician|other?",
      },
      responseShape: {
        assessment: "object",
        careLevel: "object",
        weeklyPlan: "Array<object>",
        overview: "object",
      },
    },
    submitReassessment: {
      method: "POST",
      path: "/v1/cbt/reassessment",
      requestShape: {
        epdsScore: "number",
        gad7Score: "number",
        isi7Score: "number",
        selfHarmRisk: "boolean",
        childbirthFear: "{uncertainty:number,painLossOfControl:number}",
        source: "self_report|clinician|other?",
      },
      responseShape: {
        assessment: "object",
        careLevel: "object",
        overview: "object",
        transition: "object|null",
      },
    },
    getModule: {
      method: "GET",
      path: "/v1/cbt/modules/{week}",
      responseShape: {
        id: "string",
        weekNumber: "number",
        title: "string",
        summary: "string",
        homework: "object|null",
      },
    },
    createHomework: {
      method: "POST",
      path: "/v1/cbt/homework",
      requestShape: {
        weekNumber: "number?",
        type: "thought_record|activity_plan|problem_solving|sleep_plan|birth_fear_exposure",
        status: "todo|in_progress|done?",
        response: "{summary:string?,action:string?,reflection:string?}?",
      },
      responseShape: {
        id: "string",
        moduleId: "string",
        type: "string",
        status: "todo|in_progress|done",
        response: "object",
      },
    },
    updateHomework: {
      method: "PATCH",
      path: "/v1/cbt/homework/{id}",
      requestShape: {
        status: "todo|in_progress|done?",
        response: "{summary:string?,action:string?,reflection:string?}?",
      },
      responseShape: {
        id: "string",
        moduleId: "string",
        type: "string",
        status: "todo|in_progress|done",
        response: "object",
      },
    },
    getCareTeam: {
      method: "GET",
      path: "/v1/cbt/care-team",
      responseShape: {
        careLevel: "object",
        careTeamStatus: "object",
        crisisState: "object",
        referralHistory: "Array<object>",
      },
    },
    createReferral: {
      method: "POST",
      path: "/v1/cbt/care-team/referral",
      requestShape: {
        channel: "string",
        slotId: "string?",
        note: "string?",
      },
      responseShape: {
        referral: "object",
        careTeamStatus: "object",
      },
    },
    getPartnerTasks: {
      method: "GET",
      path: "/v1/cbt/partner-tasks",
      responseShape: {
        careLevel: "object",
        headline: "string",
        todayStatus: "object",
        tasks: "Array<object>",
        clinicalReminder: "string",
      },
    },
  },
  nutrition: {
    getAdvice: {
      method: "GET",
      path: "/v1/nutrition/advice",
      requestShape: {
        pregnancyWeek: "string",
        riskLevel: "low|medium|high?",
        bmi: "number?",
        allergies: "Array<string>?",
      },
      responseShape: {
        date: "string",
        pregnancyWeek: "string",
        trimester: "first|second|third",
        nutritionGoals: {
          calories: { target: "number", actual: "number", percent: "number" },
          protein: { target: "number", actual: "number", unit: "string", percent: "number" },
          calcium: { target: "number", actual: "number", unit: "string", percent: "number" },
        },
        meals: {
          breakfast: "Array<object>",
          lunch: "Array<object>",
          dinner: "Array<object>",
          snack: "Array<object>",
        },
        restrictions: {
          avoid: "Array<object>",
          limit: "Array<object>",
        },
        tips: "Array<string>",
      },
    },
    getRecords: {
      method: "GET",
      path: "/v1/nutrition/records",
      requestShape: {
        days: "number?",
        startDate: "string?",
        endDate: "string?",
      },
      responseShape: {
        records: "Array<{id:string,date:string,mealType:string,foods:Array<object>,nutrition:object,note:string,createdAt:string}>",
      },
    },
    createRecord: {
      method: "POST",
      path: "/v1/nutrition/records",
      requestShape: {
        mealType: "breakfast|lunch|dinner|snack",
        foods: "Array<{foodId:string,amount:string,count:number}>",
        nutrition: "object",
        note: "string?",
      },
      responseShape: {
        id: "string",
        createdAt: "string",
      },
    },
    updateRecord: {
      method: "PATCH",
      path: "/v1/nutrition/records/{id}",
      requestShape: {
        foods: "Array<object>?",
        nutrition: "object?",
        note: "string?",
      },
      responseShape: {
        id: "string",
        updatedAt: "string",
      },
    },
    deleteRecord: {
      method: "DELETE",
      path: "/v1/nutrition/records/{id}",
      responseShape: {
        success: "boolean",
        message: "string",
      },
    },
    photoAnalyze: {
      method: "POST",
      path: "/v1/nutrition/photo-analyze",
      requestShape: {
        imageBase64: "string",
        fileName: "string?",
        mimeType: "string?",
        mealType: "breakfast|lunch|dinner|snack",
        pregnancyWeek: "string?",
        allergies: "Array<string>?",
        medicalContraindications: "{diet:Array<string>}?",
      },
      responseShape: {
        detectedFoods: "Array<{id:string,foodId?:string,name:string,sourceLabel:string,confidence:number,category:string}>",
        pregnancyAdvice:
          "{safe:Array<string>,caution:Array<string>,avoid:Array<string>,nutrientHighlights:Array<object>,actions:Array<string>,disclaimer:string}",
        needsUserConfirmation: "boolean",
        disclaimer: "string",
        errorMessage: "string?",
      },
    },
  },
  fitness: {
    getAdvice: {
      method: "GET",
      path: "/v1/fitness/advice",
      requestShape: {
        pregnancyWeek: "string",
        dayOfWeek: "string",
        riskLevel: "low|medium|high?",
        exerciseLevel: "beginner|intermediate|advanced?",
      },
      responseShape: {
        date: "string",
        pregnancyWeek: "string",
        dayOfWeek: "string",
        mainTask: {
          id: "string",
          name: "string",
          nameEn: "string",
          duration: "number",
          intensity: "low|medium|high",
          instructions: "string",
          estimatedCalories: "number",
        },
        totalTasksToday: "number",
        weeklyProgress: {
          completed: "number",
          total: "number",
          percent: "number",
          duration: "number",
          calories: "number",
        },
        safetyAlerts: "Array<string>",
      },
    },
    getWeeklyPlan: {
      method: "GET",
      path: "/v1/fitness/weekly-plan",
      requestShape: {
        pregnancyWeek: "string",
        riskLevel: "low|medium|high?",
        exerciseLevel: "beginner|intermediate|advanced?",
        medicalContraindications: "object?",
      },
      responseShape: {
        weekRange: "[number,number]",
        trimester: "first|second|third",
        target: "string",
        weeklyTemplate: "Array<object>",
        safetyAlerts: "Array<string>",
        adaptationNotes: {
          level: "beginner|intermediate|advanced",
          description: "string",
          startingPlan: "object",
          progression: "string",
        },
      },
    },
    getRecords: {
      method: "GET",
      path: "/v1/fitness/records",
      requestShape: {
        days: "number?",
        startDate: "string?",
        endDate: "string?",
      },
      responseShape: {
        records: "Array<{id:string,date:string,exerciseId:string,exerciseType:string,duration:number,intensity:string,feeling:number,discomfortLevel:number,discomfortSymptoms:Array<string>,calories:number,completedAt:string,createdAt:string}>",
      },
    },
    createRecord: {
      method: "POST",
      path: "/v1/fitness/records",
      requestShape: {
        exerciseId: "string",
        exerciseType: "string",
        exerciseName: "string",
        duration: "number",
        intensity: "low|medium|high",
        feeling: "number",
        discomfortLevel: "number",
        discomfortSymptoms: "Array<string>?",
        calories: "number",
        completedAt: "string",
      },
      responseShape: {
        id: "string",
        createdAt: "string",
      },
    },
    updateRecord: {
      method: "PATCH",
      path: "/v1/fitness/records/{id}",
      requestShape: {
        duration: "number?",
        feeling: "number?",
        discomfortLevel: "number?",
        discomfortSymptoms: "Array<string>?",
      },
      responseShape: {
        id: "string",
        updatedAt: "string",
      },
    },
    deleteRecord: {
      method: "DELETE",
      path: "/v1/fitness/records/{id}",
      responseShape: {
        success: "boolean",
        message: "string",
      },
    },
    getWeeklyStats: {
      method: "GET",
      path: "/v1/fitness/weekly-stats",
      responseShape: {
        count: "number",
        duration: "number",
        calories: "number",
        records: "Array<object>",
      },
    },
  },
  agent: {
    chat: {
      method: "POST",
      path: "/v1/agent/chat",
      requestShape: {
        userId: "string",
        sessionId: "string",
        message: "string",
        lang: "zh|en?",
        presetQuestionId: "string?",
        sourcePreference: "string?",
        feishuScopeId: "string?",
        clientContext: "object?",
      },
      responseShape: {
        answer: "string",
        answer_raw: "string?",
        riskLevel: "R0|R1|R2|R3",
        disclaimer: "string",
        nextActions: "Array<string>",
        escalation: "object|null",
        classification: "object|null",
        routing: "object|null",
        toolTrace: "Array<object>",
        reasoning_summary: "object|null",
        sources: "Array<{title:string,url:string,snippet:string,domain:string,published_at?:string}>",
          citations: "Array<object>",
          usedSources: "Array<string>",
          groundingSummary: "object|null",
          kbFreshness: "object|null",
          confidence: "number|null",
        fallbackReason: "string|null",
        relatedQuestionCards: "Array<object>",
        search_meta: "object|null",
        memoryUpdates: "object",
      },
    },
    getPresets: {
      method: "GET",
      path: "/v1/agent/presets",
      requestShape: {
        lang: "zh|en?",
        category: "string?",
      },
      responseShape: {
        lang: "zh|en",
        category: "string",
        items: "Array<object>",
      },
    },
    getSessionHistory: {
      method: "GET",
      path: "/v1/agent/sessions/{sessionId}/history",
      requestShape: {
        userId: "string",
      },
      responseShape: {
        sessionId: "string",
        userId: "string",
        rounds: "Array<object>",
        shortTermMemory: "object",
        updatedAt: "ISODateTime|null",
      },
    },
    getEscalations: {
      method: "GET",
      path: "/v1/agent/escalations",
      requestShape: {
        userId: "string",
        range: "string?",
      },
      responseShape: {
        userId: "string",
        range: "string",
        items: "Array<object>",
      },
    },
  },
  support: {
    getCounselingSlots: {
      method: "GET",
      path: "/v1/support/counseling-slots",
      responseShape: {
        slots: "Array<{id:string,label:string}>",
      },
    },
    getHelpCenter: {
      method: "GET",
      path: "/v1/support/help-center",
      responseShape: {
        version: "string",
        faqs: "Array<{id:string,title:string,desc:string}>",
      },
    },
    getEmergencyContacts: {
      method: "GET",
      path: "/v1/support/emergency-contacts",
      responseShape: {
        contacts: "Array<{id:string,title:string,phone:string}>",
      },
    },
  },
};
