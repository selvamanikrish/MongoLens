// Realistic production MongoDB log generator for MongoLens Demo

export function generateRealisticDemoLog(): string {
  const lines: string[] = [];
  const baseTime = new Date('2026-08-17T14:00:00.000Z').getTime();

  // Startup log lines
  lines.push(JSON.stringify({
    t: { $date: new Date(baseTime).toISOString() },
    s: "I",
    c: "CONTROL",
    id: 21951,
    ctx: "initandlisten",
    msg: "MongoDB starting",
    attr: {
      pid: 14820,
      port: 27017,
      dbPath: "/data/db",
      architecture: "64-bit",
      version: "7.0.5",
      os: "Linux 6.1.0-18-amd64"
    }
  }));

  lines.push(JSON.stringify({
    t: { $date: new Date(baseTime + 1000).toISOString() },
    s: "I",
    c: "NETWORK",
    id: 23015,
    ctx: "listener",
    msg: "Listening on 0.0.0.0:27017"
  }));

  // Connection events
  for (let c = 100; c <= 115; c++) {
    lines.push(JSON.stringify({
      t: { $date: new Date(baseTime + c * 200).toISOString() },
      s: "I",
      c: "NETWORK",
      id: 22943,
      ctx: `conn${c}`,
      msg: "Connection accepted",
      attr: {
        remote: `10.0.4.${(c % 50) + 10}:${40000 + c}`,
        connectionId: c,
        connectionCount: c - 99
      }
    }));
  }

  // Realistic sample queries pool
  const collections = [
    { db: 'arcusairdb', coll: 'patientorders', weight: 40 },
    { db: 'arcusairdb', coll: 'prescriptions', weight: 25 },
    { db: 'arcusairdb', coll: 'users', weight: 15 },
    { db: 'arcusairdb', coll: 'appointments', weight: 10 },
    { db: 'arcusairdb', coll: 'audit_logs', weight: 7 },
    { db: 'arcusairdb', coll: 'inventory', weight: 3 },
  ];

  const slowQueryTemplates = [
    {
      db: 'arcusairdb',
      coll: 'patientorders',
      op: 'aggregate',
      duration: 8420,
      plan: 'COLLSCAN',
      docsExamined: 48291,
      keysExamined: 0,
      nreturned: 450,
      cmd: {
        aggregate: 'patientorders',
        pipeline: [
          { $match: { statusflag: 'A', hospital_id: 102, is_active: true } },
          { $sort: { order_date: -1 } },
          { $limit: 100 }
        ],
        cursor: {}
      },
      appName: 'ArcusAir-BatchSync'
    },
    {
      db: 'arcusairdb',
      coll: 'prescriptions',
      op: 'find',
      duration: 4210,
      plan: 'COLLSCAN',
      docsExamined: 31821,
      keysExamined: 0,
      nreturned: 12,
      cmd: {
        find: 'prescriptions',
        filter: { patient_uuid: 'p-9941-bc', dosage_status: 'PENDING_REVIEW' },
        sort: { created_at: -1 }
      },
      appName: 'ArcusAir-WebAPI'
    },
    {
      db: 'arcusairdb',
      coll: 'patientorders',
      op: 'aggregate',
      duration: 6150,
      plan: 'COLLSCAN',
      docsExamined: 52100,
      keysExamined: 0,
      nreturned: 1200,
      cmd: {
        aggregate: 'patientorders',
        pipeline: [
          { $match: { admission_date: { $gte: '2026-08-01' } } },
          { $lookup: { from: 'users', localField: 'doctor_id', foreignField: '_id', as: 'doctor' } },
          { $unwind: '$doctor' },
          { $group: { _id: '$doctor.department', totalOrders: { $sum: 1 } } }
        ],
        cursor: {}
      },
      appName: 'ArcusAir-ReportingService'
    },
    {
      db: 'arcusairdb',
      coll: 'users',
      op: 'find',
      duration: 1840,
      plan: 'IXSCAN',
      docsExamined: 8200,
      keysExamined: 8200,
      nreturned: 4,
      cmd: {
        find: 'users',
        filter: { role: 'PHARMACIST', department_code: 'RX-EAST' },
        sort: { last_login: -1 }
      },
      appName: 'ArcusAir-Auth'
    },
    {
      db: 'arcusairdb',
      coll: 'audit_logs',
      op: 'find',
      duration: 3290,
      plan: 'COLLSCAN',
      docsExamined: 94000,
      keysExamined: 0,
      nreturned: 50,
      cmd: {
        find: 'audit_logs',
        filter: { action: 'MEDICATION_DISPENSED', 'metadata.nurse_id': 884 },
        sort: { timestamp: -1 }
      },
      appName: 'ArcusAir-AuditEngine'
    },
    {
      db: 'arcusairdb',
      coll: 'inventory',
      op: 'update',
      duration: 2140,
      plan: 'COLLSCAN',
      docsExamined: 14200,
      keysExamined: 0,
      nreturned: 1,
      cmd: {
        update: 'inventory',
        updates: [
          { q: { drug_code: 'NDC-4819-21', batch_expiry: { $lt: '2026-09-01' } }, u: { $set: { is_quarantine: true } }, multi: true }
        ]
      },
      appName: 'ArcusAir-StockWorker'
    },
    {
      db: 'arcusairdb',
      coll: 'appointments',
      op: 'find',
      duration: 1450,
      plan: 'IXSCAN { clinic_id: 1, status: 1 }',
      docsExamined: 1540,
      keysExamined: 1540,
      nreturned: 8,
      cmd: {
        find: 'appointments',
        filter: { clinic_id: 42, status: 'SCHEDULED', slot_start: { $gte: '2026-08-17' } },
        sort: { slot_start: 1 }
      },
      appName: 'ArcusAir-Scheduling'
    }
  ];

  const errorTemplates = [
    {
      s: 'E',
      c: 'QUERY',
      id: 22003,
      msg: 'Cannot execute query: MaxTimeMSExpired',
      attr: {
        error: {
          code: 50,
          codeName: 'MaxTimeMSExpired',
          errmsg: 'operation exceeded time limit of 15000ms on arcusairdb.patientorders'
        },
        ns: 'arcusairdb.patientorders',
        durationMillis: 15002
      }
    },
    {
      s: 'E',
      c: 'WRITE',
      id: 21100,
      msg: 'Write failed with duplicate key error',
      attr: {
        error: {
          code: 11000,
          codeName: 'DuplicateKey',
          errmsg: 'E11000 duplicate key error collection: arcusairdb.users index: email_1 dup key: { email: "dr.miller@arcushealth.org" }'
        },
        ns: 'arcusairdb.users',
        durationMillis: 4
      }
    },
    {
      s: 'W',
      c: 'STORAGE',
      id: 22401,
      msg: 'WiredTiger write conflict retry loop exceeded 10 iterations',
      attr: {
        ns: 'arcusairdb.inventory',
        durationMillis: 890
      }
    },
    {
      s: 'E',
      c: 'NETWORK',
      id: 22989,
      msg: 'SocketException: connection reset by peer',
      attr: {
        remote: '10.0.4.88:51294',
        connectionId: 108
      }
    },
    {
      s: 'W',
      c: 'COMMAND',
      id: 51803,
      msg: 'Slow query: Plan executor unindexed in-memory sort warning',
      attr: {
        ns: 'arcusairdb.audit_logs',
        planSummary: 'SORT',
        durationMillis: 2850
      }
    }
  ];

  // Generate 1,500 total log entries spanning 10 hours
  const totalEntries = 1500;
  const timeSpan = 10 * 3600 * 1000; // 10 hours

  for (let i = 0; i < totalEntries; i++) {
    const timestampMs = baseTime + Math.floor((i / totalEntries) * timeSpan) + Math.floor(Math.random() * 500);
    const dateStr = new Date(timestampMs).toISOString();
    const connId = 100 + (i % 25);
    const ctx = `conn${connId}`;

    // 1. Inject errors periodically
    if (i % 35 === 0) {
      const errTpl = errorTemplates[Math.floor(Math.random() * errorTemplates.length)];
      lines.push(JSON.stringify({
        t: { $date: dateStr },
        s: errTpl.s,
        c: errTpl.c,
        id: errTpl.id,
        ctx,
        msg: errTpl.msg,
        attr: {
          ...errTpl.attr,
          appName: 'ArcusAir-Service',
          remote: `10.0.4.${(connId % 50) + 10}:${40000 + connId}`
        }
      }));
      continue;
    }

    // 2. Inject slow queries
    if (i % 12 === 0) {
      const slowTpl = slowQueryTemplates[Math.floor(Math.random() * slowQueryTemplates.length)];
      const jitter = Math.floor(Math.random() * 800) - 400;
      const duration = Math.max(120, slowTpl.duration + jitter);

      lines.push(JSON.stringify({
        t: { $date: dateStr },
        s: 'I',
        c: 'COMMAND',
        id: 51803,
        ctx,
        msg: 'Slow query',
        attr: {
          type: 'command',
          ns: `${slowTpl.db}.${slowTpl.coll}`,
          appName: slowTpl.appName,
          command: slowTpl.cmd,
          planSummary: slowTpl.plan,
          keysExamined: slowTpl.keysExamined,
          docsExamined: Math.max(1, slowTpl.docsExamined + Math.floor(Math.random() * 1000)),
          nreturned: slowTpl.nreturned,
          numYields: Math.floor(duration / 120),
          ok: 1,
          durationMillis: duration,
          remote: `10.0.4.${(connId % 50) + 10}:${40000 + connId}`
        }
      }));
      continue;
    }

    // 3. Normal fast operations (find, update, insert, aggregate with IXSCAN)
    const collObj = collections[i % collections.length];
    const ops = ['find', 'find', 'find', 'update', 'insert', 'aggregate', 'delete'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const duration = Math.floor(Math.random() * 45) + 1; // 1 - 46ms

    const normalCmd: Record<string, any> = {};
    if (op === 'find') {
      normalCmd.find = collObj.coll;
      normalCmd.filter = { _id: `id_${Math.floor(Math.random() * 10000)}`, status: 'ACTIVE' };
    } else if (op === 'update') {
      normalCmd.update = collObj.coll;
      normalCmd.updates = [{ q: { _id: `id_${Math.floor(Math.random() * 10000)}` }, u: { $set: { updated_at: dateStr } } }];
    } else if (op === 'insert') {
      normalCmd.insert = collObj.coll;
      normalCmd.documents = [{ id: `id_${i}`, created_at: dateStr }];
    } else if (op === 'aggregate') {
      normalCmd.aggregate = collObj.coll;
      normalCmd.pipeline = [{ $match: { facility_id: 42 } }, { $limit: 20 }];
    } else {
      normalCmd.delete = collObj.coll;
      normalCmd.deletes = [{ q: { temp_flag: true }, limit: 1 }];
    }

    // 10% legacy log format for mixed-format resilience testing
    if (i % 10 === 0) {
      lines.push(`${dateStr.replace('Z', '+0000')} I COMMAND [${ctx}] command ${collObj.db}.${collObj.coll} command: ${op} ${JSON.stringify(normalCmd)} planSummary: IXSCAN { _id: 1 } keysExamined:1 docsExamined:1 numYields:0 nreturned:1 reslen:248 10.0.4.15:48192 ${duration}ms`);
    } else {
      lines.push(JSON.stringify({
        t: { $date: dateStr },
        s: 'I',
        c: 'COMMAND',
        id: 51803,
        ctx,
        msg: duration > 100 ? 'Slow query' : 'Command completed',
        attr: {
          type: 'command',
          ns: `${collObj.db}.${collObj.coll}`,
          appName: 'ArcusAir-WebAPI',
          command: normalCmd,
          planSummary: 'IXSCAN { _id: 1 }',
          keysExamined: 1,
          docsExamined: 1,
          nreturned: 1,
          numYields: 0,
          ok: 1,
          durationMillis: duration,
          remote: `10.0.4.${(connId % 50) + 10}:${40000 + connId}`
        }
      }));
    }
  }

  return lines.join('\n');
}
