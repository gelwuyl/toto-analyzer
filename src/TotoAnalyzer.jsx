import React, { useState, useMemo, useRef, useEffect } from 'react';

// ============================================================================
// BASE HISTORICAL DRAWS
// Real Singapore Pools TOTO results, draws 4205 -> 3892 (2026-08-03 back to
// 2023-08-04), parsed from singaporepools.com.sg via parse_toto.py. Embedded
// as the default database so the app loads accurate data on first run without
// any parser or import step. To extend history, run parse_toto.py locally and
// use the "Import" box, or wire LIVE_SYNC_ENDPOINT below to a hosted scraper.
// ============================================================================
// BASE_HISTORICAL_DRAWS is the embedded fallback (matches the 314-draw
// toto_official.csv at build time). On load, the app fetches the hosted CSV
// from the same origin and merges any newer draws on top, so the deployed
// site auto-refreshes without an in-browser scraper (no CORS issue).
const BASE_HISTORICAL_DRAWS = [
  { drawNo: 4205, date: "2026-08-03", numbers: [9,29,30,35,36,40], additional: 11 },
  { drawNo: 4204, date: "2026-07-30", numbers: [4,7,16,23,30,32], additional: 8 },
  { drawNo: 4203, date: "2026-07-27", numbers: [22,23,30,36,44,48], additional: 28 },
  { drawNo: 4202, date: "2026-07-23", numbers: [8,11,17,21,37,48], additional: 35 },
  { drawNo: 4201, date: "2026-07-20", numbers: [1,8,11,14,33,43], additional: 44 },
  { drawNo: 4200, date: "2026-07-16", numbers: [6,27,28,41,43,44], additional: 19 },
  { drawNo: 4199, date: "2026-07-13", numbers: [14,22,32,33,36,46], additional: 42 },
  { drawNo: 4198, date: "2026-07-09", numbers: [23,27,31,38,42,47], additional: 29 },
  { drawNo: 4197, date: "2026-07-06", numbers: [8,25,34,37,39,46], additional: 44 },
  { drawNo: 4196, date: "2026-07-02", numbers: [5,7,11,37,46,49], additional: 16 },
  { drawNo: 4195, date: "2026-06-29", numbers: [6,11,22,23,31,34], additional: 14 },
  { drawNo: 4194, date: "2026-06-25", numbers: [4,21,23,28,31,39], additional: 41 },
  { drawNo: 4193, date: "2026-06-22", numbers: [4,11,15,16,21,39], additional: 20 },
  { drawNo: 4192, date: "2026-06-18", numbers: [2,7,11,19,20,42], additional: 23 },
  { drawNo: 4191, date: "2026-06-15", numbers: [9,16,27,28,32,49], additional: 18 },
  { drawNo: 4190, date: "2026-06-11", numbers: [14,16,21,22,35,38], additional: 36 },
  { drawNo: 4189, date: "2026-06-08", numbers: [10,15,28,39,40,46], additional: 12 },
  { drawNo: 4188, date: "2026-06-04", numbers: [3,5,20,23,26,27], additional: 28 },
  { drawNo: 4187, date: "2026-06-01", numbers: [2,19,26,29,33,36], additional: 21 },
  { drawNo: 4186, date: "2026-05-28", numbers: [10,13,30,35,38,44], additional: 15 },
  { drawNo: 4185, date: "2026-05-25", numbers: [11,12,24,33,38,46], additional: 30 },
  { drawNo: 4184, date: "2026-05-21", numbers: [11,18,25,36,39,49], additional: 41 },
  { drawNo: 4183, date: "2026-05-18", numbers: [7,18,32,37,41,44], additional: 19 },
  { drawNo: 4182, date: "2026-05-14", numbers: [4,8,21,25,43,46], additional: 32 },
  { drawNo: 4181, date: "2026-05-11", numbers: [6,10,25,26,34,40], additional: 30 },
  { drawNo: 4180, date: "2026-05-07", numbers: [2,3,8,16,20,47], additional: 10 },
  { drawNo: 4179, date: "2026-05-04", numbers: [7,18,19,30,36,48], additional: 11 },
  { drawNo: 4178, date: "2026-04-30", numbers: [2,6,7,31,35,39], additional: 15 },
  { drawNo: 4177, date: "2026-04-27", numbers: [3,11,13,22,28,48], additional: 21 },
  { drawNo: 4176, date: "2026-04-23", numbers: [3,5,15,23,37,42], additional: 48 },
  { drawNo: 4175, date: "2026-04-20", numbers: [3,5,9,23,43,49], additional: 8 },
  { drawNo: 4174, date: "2026-04-16", numbers: [1,3,6,12,21,41], additional: 18 },
  { drawNo: 4173, date: "2026-04-13", numbers: [4,8,10,15,16,26], additional: 17 },
  { drawNo: 4172, date: "2026-04-09", numbers: [1,2,6,9,44,48], additional: 24 },
  { drawNo: 4171, date: "2026-04-06", numbers: [14,23,29,30,39,48], additional: 12 },
  { drawNo: 4170, date: "2026-04-02", numbers: [1,7,8,23,30,33], additional: 21 },
  { drawNo: 4169, date: "2026-03-30", numbers: [4,12,26,30,46,47], additional: 6 },
  { drawNo: 4168, date: "2026-03-26", numbers: [4,7,22,29,33,46], additional: 48 },
  { drawNo: 4167, date: "2026-03-23", numbers: [4,25,28,33,43,48], additional: 31 },
  { drawNo: 4166, date: "2026-03-19", numbers: [3,27,34,35,38,49], additional: 17 },
  { drawNo: 4165, date: "2026-03-16", numbers: [6,14,18,22,35,36], additional: 13 },
  { drawNo: 4164, date: "2026-03-12", numbers: [12,25,33,40,43,46], additional: 21 },
  { drawNo: 4163, date: "2026-03-09", numbers: [7,13,14,17,40,44], additional: 35 },
  { drawNo: 4162, date: "2026-03-05", numbers: [1,5,12,15,22,42], additional: 37 },
  { drawNo: 4161, date: "2026-03-02", numbers: [6,8,28,37,41,49], additional: 40 },
  { drawNo: 4160, date: "2026-02-27", numbers: [5,9,20,23,45,46], additional: 7 },
  { drawNo: 4159, date: "2026-02-23", numbers: [24,26,30,32,37,47], additional: 2 },
  { drawNo: 4158, date: "2026-02-19", numbers: [8,16,17,34,38,48], additional: 25 },
  { drawNo: 4157, date: "2026-02-16", numbers: [13,24,28,34,37,44], additional: 29 },
  { drawNo: 4156, date: "2026-02-13", numbers: [10,15,25,43,45,49], additional: 4 },
  { drawNo: 4155, date: "2026-02-09", numbers: [10,15,29,31,33,49], additional: 30 },
  { drawNo: 4154, date: "2026-02-05", numbers: [6,18,24,26,36,48], additional: 5 },
  { drawNo: 4153, date: "2026-02-02", numbers: [4,19,40,41,46,47], additional: 20 },
  { drawNo: 4152, date: "2026-01-29", numbers: [11,13,16,31,42,48], additional: 21 },
  { drawNo: 4151, date: "2026-01-26", numbers: [10,11,13,26,32,39], additional: 44 },
  { drawNo: 4150, date: "2026-01-22", numbers: [6,22,27,32,37,44], additional: 19 },
  { drawNo: 4149, date: "2026-01-19", numbers: [4,11,21,23,31,35], additional: 48 },
  { drawNo: 4148, date: "2026-01-15", numbers: [16,32,34,35,36,41], additional: 14 },
  { drawNo: 4147, date: "2026-01-12", numbers: [1,9,16,18,35,43], additional: 12 },
  { drawNo: 4146, date: "2026-01-08", numbers: [3,14,15,17,25,27], additional: 31 },
  { drawNo: 4145, date: "2026-01-05", numbers: [5,20,35,39,40,49], additional: 27 },
  { drawNo: 4144, date: "2026-01-02", numbers: [11,18,20,32,38,39], additional: 34 },
  { drawNo: 4143, date: "2025-12-29", numbers: [2,4,22,24,30,33], additional: 49 },
  { drawNo: 4142, date: "2025-12-25", numbers: [3,8,15,28,37,43], additional: 49 },
  { drawNo: 4141, date: "2025-12-22", numbers: [4,5,13,22,24,30], additional: 36 },
  { drawNo: 4140, date: "2025-12-18", numbers: [2,14,15,30,31,43], additional: 27 },
  { drawNo: 4139, date: "2025-12-15", numbers: [17,21,22,35,37,42], additional: 9 },
  { drawNo: 4138, date: "2025-12-11", numbers: [6,11,20,28,33,43], additional: 16 },
  { drawNo: 4137, date: "2025-12-08", numbers: [9,12,15,23,27,47], additional: 45 },
  { drawNo: 4136, date: "2025-12-04", numbers: [1,5,24,36,41,46], additional: 39 },
  { drawNo: 4135, date: "2025-12-01", numbers: [2,10,24,35,45,49], additional: 37 },
  { drawNo: 4134, date: "2025-11-27", numbers: [6,8,17,28,32,46], additional: 16 },
  { drawNo: 4133, date: "2025-11-24", numbers: [8,25,27,34,45,47], additional: 19 },
  { drawNo: 4132, date: "2025-11-20", numbers: [11,13,22,31,47,49], additional: 39 },
  { drawNo: 4131, date: "2025-11-17", numbers: [3,9,12,18,19,34], additional: 24 },
  { drawNo: 4130, date: "2025-11-13", numbers: [6,13,18,22,34,35], additional: 40 },
  { drawNo: 4129, date: "2025-11-10", numbers: [2,11,12,19,25,36], additional: 16 },
  { drawNo: 4128, date: "2025-11-06", numbers: [3,20,24,29,32,44], additional: 46 },
  { drawNo: 4127, date: "2025-11-03", numbers: [10,19,22,34,39,43], additional: 35 },
  { drawNo: 4126, date: "2025-10-30", numbers: [1,5,31,34,38,45], additional: 21 },
  { drawNo: 4125, date: "2025-10-27", numbers: [4,12,14,24,36,38], additional: 17 },
  { drawNo: 4124, date: "2025-10-23", numbers: [7,14,17,18,31,38], additional: 46 },
  { drawNo: 4123, date: "2025-10-20", numbers: [3,10,13,15,32,37], additional: 8 },
  { drawNo: 4122, date: "2025-10-16", numbers: [2,4,8,19,35,39], additional: 7 },
  { drawNo: 4121, date: "2025-10-13", numbers: [5,31,33,34,38,46], additional: 39 },
  { drawNo: 4120, date: "2025-10-09", numbers: [13,14,19,22,31,42], additional: 41 },
  { drawNo: 4119, date: "2025-10-06", numbers: [10,15,22,31,42,48], additional: 4 },
  { drawNo: 4118, date: "2025-10-02", numbers: [19,22,26,37,40,46], additional: 14 },
  { drawNo: 4117, date: "2025-09-29", numbers: [15,16,22,34,35,43], additional: 26 },
  { drawNo: 4116, date: "2025-09-25", numbers: [1,6,9,11,29,36], additional: 12 },
  { drawNo: 4115, date: "2025-09-22", numbers: [8,15,22,24,43,47], additional: 44 },
  { drawNo: 4114, date: "2025-09-18", numbers: [6,8,9,20,45,49], additional: 21 },
  { drawNo: 4113, date: "2025-09-15", numbers: [10,19,25,29,33,37], additional: 24 },
  { drawNo: 4112, date: "2025-09-11", numbers: [2,15,19,35,41,48], additional: 33 },
  { drawNo: 4111, date: "2025-09-08", numbers: [1,3,33,38,39,42], additional: 31 },
  { drawNo: 4110, date: "2025-09-04", numbers: [8,12,21,38,40,43], additional: 25 },
  { drawNo: 4109, date: "2025-09-01", numbers: [3,4,8,13,14,17], additional: 20 },
  { drawNo: 4108, date: "2025-08-28", numbers: [10,11,16,24,34,35], additional: 1 },
  { drawNo: 4107, date: "2025-08-25", numbers: [2,3,4,16,22,39], additional: 48 },
  { drawNo: 4106, date: "2025-08-21", numbers: [4,13,22,36,38,46], additional: 12 },
  { drawNo: 4105, date: "2025-08-18", numbers: [1,4,18,24,37,42], additional: 26 },
  { drawNo: 4104, date: "2025-08-14", numbers: [22,25,29,31,34,43], additional: 11 },
  { drawNo: 4103, date: "2025-08-11", numbers: [9,24,31,34,43,44], additional: 1 },
  { drawNo: 4102, date: "2025-08-08", numbers: [2,15,28,39,42,44], additional: 5 },
  { drawNo: 4101, date: "2025-08-04", numbers: [30,32,40,43,45,49], additional: 5 },
  { drawNo: 4100, date: "2025-07-31", numbers: [7,19,20,21,22,29], additional: 37 },
  { drawNo: 4099, date: "2025-07-28", numbers: [2,14,16,21,36,47], additional: 1 },
  { drawNo: 4098, date: "2025-07-24", numbers: [9,11,24,32,39,49], additional: 26 },
  { drawNo: 4097, date: "2025-07-21", numbers: [2,5,10,12,14,37], additional: 17 },
  { drawNo: 4096, date: "2025-07-17", numbers: [7,8,17,29,32,42], additional: 1 },
  { drawNo: 4095, date: "2025-07-14", numbers: [2,8,19,29,38,41], additional: 20 },
  { drawNo: 4094, date: "2025-07-10", numbers: [12,21,26,27,35,44], additional: 10 },
  { drawNo: 4093, date: "2025-07-07", numbers: [10,15,17,33,36,45], additional: 34 },
  { drawNo: 4092, date: "2025-07-03", numbers: [6,15,16,17,25,34], additional: 31 },
  { drawNo: 4091, date: "2025-06-30", numbers: [11,27,31,33,34,36], additional: 13 },
  { drawNo: 4090, date: "2025-06-26", numbers: [10,26,28,35,37,46], additional: 20 },
  { drawNo: 4089, date: "2025-06-23", numbers: [2,15,29,37,45,49], additional: 24 },
  { drawNo: 4088, date: "2025-06-19", numbers: [1,10,37,40,45,47], additional: 19 },
  { drawNo: 4087, date: "2025-06-16", numbers: [5,18,27,32,48,49], additional: 21 },
  { drawNo: 4086, date: "2025-06-12", numbers: [3,7,38,41,44,49], additional: 20 },
  { drawNo: 4085, date: "2025-06-09", numbers: [7,10,11,21,32,48], additional: 27 },
  { drawNo: 4084, date: "2025-06-05", numbers: [2,5,25,26,29,30], additional: 42 },
  { drawNo: 4083, date: "2025-06-02", numbers: [10,19,21,22,28,31], additional: 34 },
  { drawNo: 4082, date: "2025-05-29", numbers: [1,5,7,11,19,47], additional: 44 },
  { drawNo: 4081, date: "2025-05-26", numbers: [5,9,15,28,46,48], additional: 8 },
  { drawNo: 4080, date: "2025-05-22", numbers: [3,10,32,34,44,48], additional: 29 },
  { drawNo: 4079, date: "2025-05-19", numbers: [2,15,17,18,39,45], additional: 26 },
  { drawNo: 4078, date: "2025-05-15", numbers: [9,16,17,20,34,38], additional: 18 },
  { drawNo: 4077, date: "2025-05-12", numbers: [6,16,20,23,40,48], additional: 45 },
  { drawNo: 4076, date: "2025-05-08", numbers: [9,13,17,39,46,47], additional: 22 },
  { drawNo: 4075, date: "2025-05-05", numbers: [5,8,28,38,40,43], additional: 39 },
  { drawNo: 4074, date: "2025-05-01", numbers: [2,8,12,30,35,49], additional: 38 },
  { drawNo: 4073, date: "2025-04-28", numbers: [3,8,12,18,24,41], additional: 11 },
  { drawNo: 4072, date: "2025-04-24", numbers: [17,19,21,23,30,40], additional: 33 },
  { drawNo: 4071, date: "2025-04-21", numbers: [1,17,30,37,41,43], additional: 32 },
  { drawNo: 4070, date: "2025-04-17", numbers: [15,17,26,31,40,46], additional: 19 },
  { drawNo: 4069, date: "2025-04-14", numbers: [6,14,29,30,35,42], additional: 25 },
  { drawNo: 4068, date: "2025-04-10", numbers: [14,26,27,30,46,48], additional: 10 },
  { drawNo: 4067, date: "2025-04-07", numbers: [7,19,35,40,43,47], additional: 33 },
  { drawNo: 4066, date: "2025-04-03", numbers: [12,14,15,16,21,40], additional: 23 },
  { drawNo: 4065, date: "2025-03-31", numbers: [9,12,17,23,29,46], additional: 20 },
  { drawNo: 4064, date: "2025-03-27", numbers: [21,22,27,35,40,42], additional: 3 },
  { drawNo: 4063, date: "2025-03-24", numbers: [18,19,25,28,31,44], additional: 34 },
  { drawNo: 4062, date: "2025-03-20", numbers: [9,10,11,13,23,42], additional: 20 },
  { drawNo: 4061, date: "2025-03-17", numbers: [7,30,39,42,43,48], additional: 33 },
  { drawNo: 4060, date: "2025-03-13", numbers: [16,26,34,36,42,49], additional: 41 },
  { drawNo: 4059, date: "2025-03-10", numbers: [5,7,32,38,42,47], additional: 27 },
  { drawNo: 4058, date: "2025-03-06", numbers: [19,33,35,38,46,49], additional: 39 },
  { drawNo: 4057, date: "2025-03-03", numbers: [4,16,24,25,43,49], additional: 46 },
  { drawNo: 4056, date: "2025-02-27", numbers: [2,10,13,15,37,40], additional: 28 },
  { drawNo: 4055, date: "2025-02-24", numbers: [24,37,38,42,48,49], additional: 31 },
  { drawNo: 4054, date: "2025-02-20", numbers: [3,25,31,37,39,42], additional: 21 },
  { drawNo: 4053, date: "2025-02-17", numbers: [1,16,23,39,41,42], additional: 9 },
  { drawNo: 4052, date: "2025-02-13", numbers: [5,8,13,28,30,49], additional: 17 },
  { drawNo: 4051, date: "2025-02-10", numbers: [1,3,7,18,34,39], additional: 46 },
  { drawNo: 4050, date: "2025-02-07", numbers: [16,18,22,23,28,35], additional: 32 },
  { drawNo: 4049, date: "2025-02-03", numbers: [1,12,29,31,41,48], additional: 25 },
  { drawNo: 4048, date: "2025-01-30", numbers: [2,9,13,24,26,43], additional: 49 },
  { drawNo: 4047, date: "2025-01-27", numbers: [7,16,22,26,33,43], additional: 44 },
  { drawNo: 4046, date: "2025-01-24", numbers: [9,10,18,35,43,49], additional: 42 },
  { drawNo: 4045, date: "2025-01-20", numbers: [3,5,6,16,32,49], additional: 4 },
  { drawNo: 4044, date: "2025-01-16", numbers: [6,13,18,27,35,46], additional: 48 },
  { drawNo: 4043, date: "2025-01-13", numbers: [3,7,11,13,34,35], additional: 17 },
  { drawNo: 4042, date: "2025-01-09", numbers: [13,32,34,36,38,40], additional: 37 },
  { drawNo: 4041, date: "2025-01-06", numbers: [6,10,13,27,41,49], additional: 4 },
  { drawNo: 4040, date: "2025-01-03", numbers: [9,11,24,29,39,46], additional: 31 },
  { drawNo: 4039, date: "2024-12-30", numbers: [3,10,13,29,32,46], additional: 18 },
  { drawNo: 4038, date: "2024-12-26", numbers: [8,21,30,35,44,49], additional: 39 },
  { drawNo: 4037, date: "2024-12-23", numbers: [34,40,42,44,45,46], additional: 19 },
  { drawNo: 4036, date: "2024-12-19", numbers: [3,9,10,20,23,32], additional: 42 },
  { drawNo: 4035, date: "2024-12-16", numbers: [13,19,22,26,40,49], additional: 45 },
  { drawNo: 4034, date: "2024-12-12", numbers: [17,18,19,31,32,33], additional: 8 },
  { drawNo: 4033, date: "2024-12-09", numbers: [1,4,8,10,16,46], additional: 23 },
  { drawNo: 4032, date: "2024-12-05", numbers: [8,14,15,20,31,49], additional: 13 },
  { drawNo: 4031, date: "2024-12-02", numbers: [10,11,12,21,41,49], additional: 44 },
  { drawNo: 4030, date: "2024-11-28", numbers: [1,2,4,15,18,24], additional: 35 },
  { drawNo: 4029, date: "2024-11-25", numbers: [26,28,31,38,41,42], additional: 23 },
  { drawNo: 4028, date: "2024-11-21", numbers: [4,7,11,14,21,28], additional: 36 },
  { drawNo: 4027, date: "2024-11-18", numbers: [1,2,14,36,44,46], additional: 20 },
  { drawNo: 4026, date: "2024-11-14", numbers: [12,16,29,36,39,40], additional: 37 },
  { drawNo: 4025, date: "2024-11-11", numbers: [13,28,39,43,46,48], additional: 30 },
  { drawNo: 4024, date: "2024-11-07", numbers: [4,12,17,18,23,34], additional: 28 },
  { drawNo: 4023, date: "2024-11-04", numbers: [14,18,25,28,29,44], additional: 36 },
  { drawNo: 4022, date: "2024-10-31", numbers: [2,6,10,17,18,49], additional: 35 },
  { drawNo: 4021, date: "2024-10-28", numbers: [10,16,33,37,45,47], additional: 6 },
  { drawNo: 4020, date: "2024-10-24", numbers: [20,24,28,37,46,47], additional: 36 },
  { drawNo: 4019, date: "2024-10-21", numbers: [4,13,19,44,46,49], additional: 31 },
  { drawNo: 4018, date: "2024-10-17", numbers: [2,4,10,25,36,38], additional: 22 },
  { drawNo: 4017, date: "2024-10-14", numbers: [12,33,39,42,43,48], additional: 10 },
  { drawNo: 4016, date: "2024-10-10", numbers: [1,17,24,25,27,39], additional: 30 },
  { drawNo: 4015, date: "2024-10-07", numbers: [16,22,23,31,41,49], additional: 8 },
  { drawNo: 4014, date: "2024-10-03", numbers: [2,9,15,17,40,48], additional: 28 },
  { drawNo: 4013, date: "2024-09-30", numbers: [4,33,34,38,40,43], additional: 15 },
  { drawNo: 4012, date: "2024-09-26", numbers: [17,23,26,31,38,40], additional: 14 },
  { drawNo: 4011, date: "2024-09-23", numbers: [9,20,22,32,37,47], additional: 1 },
  { drawNo: 4010, date: "2024-09-19", numbers: [7,13,17,22,31,37], additional: 1 },
  { drawNo: 4009, date: "2024-09-16", numbers: [2,8,15,19,33,38], additional: 21 },
  { drawNo: 4008, date: "2024-09-12", numbers: [5,6,14,36,45,49], additional: 12 },
  { drawNo: 4007, date: "2024-09-09", numbers: [1,4,10,16,18,29], additional: 6 },
  { drawNo: 4006, date: "2024-09-05", numbers: [1,13,27,38,40,43], additional: 2 },
  { drawNo: 4005, date: "2024-09-02", numbers: [6,7,13,30,37,39], additional: 16 },
  { drawNo: 4004, date: "2024-08-29", numbers: [3,9,10,12,27,41], additional: 29 },
  { drawNo: 4003, date: "2024-08-26", numbers: [6,8,18,34,35,37], additional: 33 },
  { drawNo: 4002, date: "2024-08-22", numbers: [2,5,8,43,45,48], additional: 41 },
  { drawNo: 4001, date: "2024-08-19", numbers: [2,3,16,26,29,41], additional: 12 },
  { drawNo: 4000, date: "2024-08-15", numbers: [15,24,35,36,42,46], additional: 48 },
  { drawNo: 3999, date: "2024-08-12", numbers: [2,8,27,33,34,43], additional: 11 },
  { drawNo: 3998, date: "2024-08-08", numbers: [23,26,32,36,41,49], additional: 31 },
  { drawNo: 3997, date: "2024-08-05", numbers: [1,12,15,30,42,43], additional: 22 },
  { drawNo: 3996, date: "2024-08-02", numbers: [14,16,22,23,36,42], additional: 21 },
  { drawNo: 3995, date: "2024-07-29", numbers: [19,24,29,30,31,46], additional: 28 },
  { drawNo: 3994, date: "2024-07-25", numbers: [14,21,34,35,43,49], additional: 33 },
  { drawNo: 3993, date: "2024-07-22", numbers: [4,9,12,15,37,47], additional: 44 },
  { drawNo: 3992, date: "2024-07-18", numbers: [8,10,11,12,14,20], additional: 38 },
  { drawNo: 3991, date: "2024-07-15", numbers: [4,6,17,32,37,41], additional: 10 },
  { drawNo: 3990, date: "2024-07-11", numbers: [15,17,22,32,34,40], additional: 6 },
  { drawNo: 3989, date: "2024-07-08", numbers: [15,18,29,34,38,44], additional: 35 },
  { drawNo: 3988, date: "2024-07-04", numbers: [4,9,12,15,31,44], additional: 33 },
  { drawNo: 3987, date: "2024-07-01", numbers: [11,19,21,26,28,33], additional: 39 },
  { drawNo: 3986, date: "2024-06-27", numbers: [1,8,11,14,17,30], additional: 5 },
  { drawNo: 3985, date: "2024-06-24", numbers: [20,23,28,30,34,49], additional: 25 },
  { drawNo: 3984, date: "2024-06-20", numbers: [3,12,14,16,17,30], additional: 27 },
  { drawNo: 3983, date: "2024-06-17", numbers: [8,10,12,16,17,30], additional: 19 },
  { drawNo: 3982, date: "2024-06-13", numbers: [4,7,10,17,30,41], additional: 21 },
  { drawNo: 3981, date: "2024-06-10", numbers: [1,10,13,23,31,34], additional: 43 },
  { drawNo: 3980, date: "2024-06-06", numbers: [4,5,10,14,35,43], additional: 12 },
  { drawNo: 3979, date: "2024-06-03", numbers: [1,28,30,32,33,39], additional: 11 },
  { drawNo: 3978, date: "2024-05-30", numbers: [6,9,11,17,28,45], additional: 21 },
  { drawNo: 3977, date: "2024-05-27", numbers: [14,23,28,34,41,48], additional: 17 },
  { drawNo: 3976, date: "2024-05-23", numbers: [3,4,22,27,39,43], additional: 6 },
  { drawNo: 3975, date: "2024-05-20", numbers: [7,10,32,33,39,48], additional: 37 },
  { drawNo: 3974, date: "2024-05-16", numbers: [2,12,15,28,35,48], additional: 24 },
  { drawNo: 3973, date: "2024-05-13", numbers: [2,16,17,22,24,49], additional: 42 },
  { drawNo: 3972, date: "2024-05-09", numbers: [9,15,20,26,43,49], additional: 36 },
  { drawNo: 3971, date: "2024-05-06", numbers: [1,5,9,31,33,37], additional: 36 },
  { drawNo: 3970, date: "2024-05-02", numbers: [4,5,31,37,43,46], additional: 7 },
  { drawNo: 3969, date: "2024-04-29", numbers: [2,7,12,31,36,45], additional: 30 },
  { drawNo: 3968, date: "2024-04-25", numbers: [5,9,11,18,28,36], additional: 35 },
  { drawNo: 3967, date: "2024-04-22", numbers: [6,8,11,16,33,37], additional: 23 },
  { drawNo: 3966, date: "2024-04-18", numbers: [18,22,29,32,37,47], additional: 49 },
  { drawNo: 3965, date: "2024-04-15", numbers: [5,10,28,36,41,42], additional: 19 },
  { drawNo: 3964, date: "2024-04-11", numbers: [22,28,33,40,43,47], additional: 16 },
  { drawNo: 3963, date: "2024-04-08", numbers: [12,23,24,34,43,46], additional: 42 },
  { drawNo: 3962, date: "2024-04-04", numbers: [3,4,13,31,36,43], additional: 19 },
  { drawNo: 3961, date: "2024-04-01", numbers: [3,12,18,19,27,41], additional: 15 },
  { drawNo: 3960, date: "2024-03-28", numbers: [6,8,13,17,26,37], additional: 18 },
  { drawNo: 3959, date: "2024-03-25", numbers: [4,23,25,27,28,32], additional: 21 },
  { drawNo: 3958, date: "2024-03-21", numbers: [6,8,18,19,33,44], additional: 15 },
  { drawNo: 3957, date: "2024-03-18", numbers: [1,4,6,15,30,48], additional: 45 },
  { drawNo: 3956, date: "2024-03-14", numbers: [8,26,34,35,45,46], additional: 36 },
  { drawNo: 3955, date: "2024-03-11", numbers: [5,9,30,37,40,49], additional: 33 },
  { drawNo: 3954, date: "2024-03-07", numbers: [5,11,15,20,31,47], additional: 44 },
  { drawNo: 3953, date: "2024-03-04", numbers: [13,17,25,27,28,44], additional: 3 },
  { drawNo: 3952, date: "2024-02-29", numbers: [1,14,28,44,45,49], additional: 16 },
  { drawNo: 3951, date: "2024-02-26", numbers: [2,8,14,27,39,42], additional: 10 },
  { drawNo: 3950, date: "2024-02-23", numbers: [18,21,26,35,38,43], additional: 40 },
  { drawNo: 3949, date: "2024-02-19", numbers: [1,10,21,29,35,42], additional: 27 },
  { drawNo: 3948, date: "2024-02-15", numbers: [15,18,22,35,41,48], additional: 5 },
  { drawNo: 3947, date: "2024-02-12", numbers: [9,16,20,25,31,39], additional: 41 },
  { drawNo: 3946, date: "2024-02-08", numbers: [6,16,21,27,31,37], additional: 49 },
  { drawNo: 3945, date: "2024-02-05", numbers: [14,17,20,25,28,37], additional: 13 },
  { drawNo: 3944, date: "2024-02-02", numbers: [2,27,29,36,44,48], additional: 12 },
  { drawNo: 3943, date: "2024-01-29", numbers: [20,22,24,28,40,49], additional: 27 },
  { drawNo: 3942, date: "2024-01-25", numbers: [10,18,44,45,48,49], additional: 20 },
  { drawNo: 3941, date: "2024-01-22", numbers: [1,3,8,13,40,48], additional: 6 },
  { drawNo: 3940, date: "2024-01-18", numbers: [5,28,30,37,38,41], additional: 43 },
  { drawNo: 3939, date: "2024-01-15", numbers: [24,25,26,28,30,35], additional: 4 },
  { drawNo: 3938, date: "2024-01-11", numbers: [2,9,10,43,45,46], additional: 13 },
  { drawNo: 3937, date: "2024-01-08", numbers: [11,20,28,30,36,38], additional: 37 },
  { drawNo: 3936, date: "2024-01-05", numbers: [7,12,17,20,31,35], additional: 22 },
  { drawNo: 3935, date: "2024-01-01", numbers: [8,16,23,24,36,48], additional: 5 },
  { drawNo: 3934, date: "2023-12-28", numbers: [13,17,18,24,37,41], additional: 15 },
  { drawNo: 3933, date: "2023-12-25", numbers: [11,12,19,23,25,41], additional: 47 },
  { drawNo: 3932, date: "2023-12-21", numbers: [7,8,24,25,29,40], additional: 18 },
  { drawNo: 3931, date: "2023-12-18", numbers: [12,15,16,23,24,38], additional: 44 },
  { drawNo: 3930, date: "2023-12-14", numbers: [22,32,34,39,40,42], additional: 5 },
  { drawNo: 3929, date: "2023-12-11", numbers: [9,12,21,22,44,47], additional: 31 },
  { drawNo: 3928, date: "2023-12-07", numbers: [10,16,25,29,42,44], additional: 48 },
  { drawNo: 3927, date: "2023-12-04", numbers: [6,18,26,31,37,38], additional: 22 },
  { drawNo: 3926, date: "2023-11-30", numbers: [3,32,34,38,41,42], additional: 17 },
  { drawNo: 3925, date: "2023-11-27", numbers: [16,19,20,26,33,40], additional: 23 },
  { drawNo: 3924, date: "2023-11-23", numbers: [2,24,30,37,43,45], additional: 35 },
  { drawNo: 3923, date: "2023-11-20", numbers: [12,13,18,22,25,28], additional: 47 },
  { drawNo: 3922, date: "2023-11-16", numbers: [10,13,15,28,29,37], additional: 22 },
  { drawNo: 3921, date: "2023-11-13", numbers: [6,10,16,24,27,43], additional: 31 },
  { drawNo: 3920, date: "2023-11-09", numbers: [2,3,11,17,35,40], additional: 45 },
  { drawNo: 3919, date: "2023-11-06", numbers: [11,20,22,28,32,37], additional: 4 },
  { drawNo: 3918, date: "2023-11-02", numbers: [3,12,22,29,35,42], additional: 49 },
  { drawNo: 3917, date: "2023-10-30", numbers: [12,24,26,32,34,38], additional: 28 },
  { drawNo: 3916, date: "2023-10-26", numbers: [1,6,17,19,34,45], additional: 48 },
  { drawNo: 3915, date: "2023-10-23", numbers: [2,3,13,15,34,37], additional: 8 },
  { drawNo: 3914, date: "2023-10-19", numbers: [1,7,16,20,35,41], additional: 6 },
  { drawNo: 3913, date: "2023-10-16", numbers: [21,27,30,38,40,44], additional: 6 },
  { drawNo: 3912, date: "2023-10-12", numbers: [14,15,26,35,44,46], additional: 43 },
  { drawNo: 3911, date: "2023-10-09", numbers: [1,5,9,25,44,49], additional: 43 },
  { drawNo: 3910, date: "2023-10-05", numbers: [4,7,9,38,41,42], additional: 16 },
  { drawNo: 3909, date: "2023-10-02", numbers: [2,10,12,13,45,48], additional: 11 },
  { drawNo: 3908, date: "2023-09-28", numbers: [3,13,23,28,37,38], additional: 9 },
  { drawNo: 3907, date: "2023-09-25", numbers: [3,14,19,23,28,43], additional: 25 },
  { drawNo: 3906, date: "2023-09-21", numbers: [2,8,28,31,48,49], additional: 37 },
  { drawNo: 3905, date: "2023-09-18", numbers: [4,7,27,32,37,49], additional: 44 },
  { drawNo: 3904, date: "2023-09-14", numbers: [14,18,24,26,37,45], additional: 28 },
  { drawNo: 3903, date: "2023-09-11", numbers: [1,20,21,27,38,48], additional: 17 },
  { drawNo: 3902, date: "2023-09-07", numbers: [17,19,24,26,31,46], additional: 37 },
  { drawNo: 3901, date: "2023-09-04", numbers: [1,4,12,33,45,48], additional: 35 },
  { drawNo: 3900, date: "2023-08-31", numbers: [14,29,31,39,40,48], additional: 47 },
  { drawNo: 3899, date: "2023-08-28", numbers: [1,3,7,12,15,32], additional: 34 },
  { drawNo: 3898, date: "2023-08-24", numbers: [1,13,26,34,37,41], additional: 9 },
  { drawNo: 3897, date: "2023-08-21", numbers: [1,18,21,28,31,41], additional: 11 },
  { drawNo: 3896, date: "2023-08-17", numbers: [4,8,32,33,45,47], additional: 12 },
  { drawNo: 3895, date: "2023-08-14", numbers: [5,22,31,32,41,49], additional: 14 },
  { drawNo: 3894, date: "2023-08-10", numbers: [3,6,16,29,37,45], additional: 12 },
  { drawNo: 3893, date: "2023-08-07", numbers: [5,15,18,31,41,49], additional: 16 },
  { drawNo: 3892, date: "2023-08-04", numbers: [19,25,27,28,29,48], additional: 34 },
];

const THEORETICAL_6 = [
  { matches: 0, prob: 43.596, freq: '1 in 2.3' },
  { matches: 1, prob: 41.302, freq: '1 in 2.4' },
  { matches: 2, prob: 13.238, freq: '1 in 7.6' },
  { matches: 3, prob: 1.765, freq: '1 in 56.6' },
  { matches: 4, prob: 0.097, freq: '1 in 1,032' },
  { matches: 5, prob: 0.002, freq: '1 in 54,200' },
  { matches: 6, prob: 0.000007, freq: '1 in 14M' },
];

const THEORETICAL_7 = [
  { matches: 0, prob: 31.41, freq: '1 in 3.2' },
  { matches: 1, prob: 42.75, freq: '1 in 2.3' },
  { matches: 2, prob: 20.80, freq: '1 in 4.8' },
  { matches: 3, prob: 4.56, freq: '1 in 21.9' },
  { matches: 4, prob: 0.47, freq: '1 in 213' },
  { matches: 5, prob: 0.02, freq: 'Rare' },
  { matches: 6, prob: 0.00, freq: 'Extremely Rare' },
];

// Set this to your hosted parse_toto.py endpoint (e.g. Cloud Run) to enable
// live "Pull Latest Results". Left null = button opens the local CSV import.
const LIVE_SYNC_ENDPOINT = null;

// Helper to determine ball styling based on TOTO color groupings
const getBallStyle = (num) => {
  if (num <= 10) return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  if (num <= 20) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  if (num <= 30) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  if (num <= 40) return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
  return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
};

// Validate a parsed draw row; enforce 1..49, 6 unique main + 1 additional.
const isValidDraw = (d) => {
  if (!d || !Array.isArray(d.numbers) || d.numbers.length !== 6) return false;
  const all = [...d.numbers, d.additional];
  if (all.some((n) => !Number.isInteger(n) || n < 1 || n > 49)) return false;
  if (new Set(d.numbers).size !== 6) return false;
  return true;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 text-center">
           <div className="bg-slate-900 border border-rose-800 p-8 rounded-xl max-w-md w-full shadow-2xl">
             <h2 className="text-xl font-bold text-rose-400 mb-3">Application Error</h2>
             <p className="text-sm text-slate-400 mb-6">We encountered an unexpected issue rendering this view. Please reload to continue.</p>
             <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg transition-colors">
               Reload Application
             </button>
           </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const PrizeBox = ({ title, desc, count, isHigh }) => (
  <div className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center shadow-inner transition-colors ${count > 0 ? (isHigh ? 'bg-amber-950/40 border-amber-500/50' : 'bg-blue-950/40 border-blue-500/50') : 'bg-slate-950/50 border-slate-800/80'}`}>
    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{title}</span>
    <span className="text-xs text-slate-500 my-1 font-mono">{desc}</span>
    <span className={`text-xl font-bold mt-1 ${count > 0 ? (isHigh ? 'text-amber-400 drop-shadow-md' : 'text-blue-400 drop-shadow-md') : 'text-slate-700'}`}>{count}</span>
  </div>
);

function TotoAnalyzerApp() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'history', 'planner', 'stats', 'data'
  const [includeBonus, setIncludeBonus] = useState(true); 
  const [selectedMatchFilter, setSelectedMatchFilter] = useState(null); 
  const [recentFilter, setRecentFilter] = useState(1); // 1 = >=1 match, 2 = >=2, 3 = >=3
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data State
  const [customDataset, setCustomDataset] = useState(null);
  const [csvRawText, setCsvRawText] = useState('');
  const [csvError, setCsvError] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const fileInputRef = useRef(null);

  // On mount: fetch the hosted CSV (same-origin on Pages) and merge newer
  // draws over the embedded base. Failures are silent => embedded base stays.
  useEffect(() => {
    let cancelled = false;
    fetch('toto_official.csv')
      .then(r => { if (!r.ok) throw new Error('csv ' + r.status); return r.text(); })
      .then(text => {
        if (cancelled) return;
        const parsed = parseCSVData(text, true);
        if (parsed && parsed.length) {
          const merged = [...parsed, ...BASE_HISTORICAL_DRAWS]
            .sort((a, b) => b.drawNo - a.drawNo)
            .filter((d, i, arr) => i === 0 || arr[i - 1].drawNo !== d.drawNo);
          setCustomDataset(merged);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Planner + Wheeling State (shared selector)
  const [betNumbers, setBetNumbers] = useState([]);
  const [wheelMode, setWheelMode] = useState('full'); // 'full' = System entry, 'abbrev' = covering wheel
  const [wheelT, setWheelT] = useState(3); // guarantee at least t matches
  const [wheelM, setWheelM] = useState(4); // if m of your numbers are drawn
  const [generatedWheel, setGeneratedWheel] = useState([]);
  const [wheelMeta, setWheelMeta] = useState(null);
  const [copyMsg, setCopyMsg] = useState('');

  // Get active dataset (custom import overrides the embedded base)
  const activeDraws = customDataset || BASE_HISTORICAL_DRAWS;

  const consecutivePairs = useMemo(() => {
    if (!activeDraws || activeDraws.length < 2) return [];
    const sorted = [...activeDraws].sort((a, b) => a.drawNo - b.drawNo);
    const pairs = [];
    for (let i = 1; i < sorted.length; i++) {
      const prior = sorted[i - 1];
      const current = sorted[i];
      const setA = includeBonus ? [...prior.numbers, prior.additional] : prior.numbers;
      const setB = includeBonus ? [...current.numbers, current.additional] : current.numbers;
      const matches = setA.filter(num => setB.includes(num));
      pairs.push({
        pairId: `${prior.drawNo}-${current.drawNo}`,
        prior,
        current,
        matches,
        matchCount: matches.length
      });
    }
    return pairs.reverse();
  }, [activeDraws, includeBonus]);

  const datasetStats = useMemo(() => {
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    consecutivePairs.forEach(pair => {
      if (counts[pair.matchCount] !== undefined) {
        counts[pair.matchCount]++;
      }
    });
    const total = consecutivePairs.length;
    const distribution = [0, 1, 2, 3, 4, 5, 6].map(m => ({
      matches: m,
      count: counts[m],
      percentage: total > 0 ? (counts[m] / total) * 100 : 0
    }));
    return { total, counts, distribution };
  }, [consecutivePairs]);

  const filteredPairs = useMemo(() => {
    return consecutivePairs.filter(pair => {
      if (selectedMatchFilter !== null && pair.matchCount !== selectedMatchFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesDraw = pair.prior.drawNo.toString().includes(q) || pair.current.drawNo.toString().includes(q);
        const matchesDate = pair.prior.date.includes(q) || pair.current.date.includes(q);
        const matchesNumber = pair.matches.some(n => n.toString() === q);
        return matchesDraw || matchesDate || matchesNumber;
      }
      return true;
    });
  }, [consecutivePairs, selectedMatchFilter, searchQuery]);

  const handleSelectMatchFilter = (matchNum) => {
    setSelectedMatchFilter(matchNum);
    setActiveTab('history');
  };

  const toggleBetNumber = (num) => {
    if (betNumbers.includes(num)) {
      setBetNumbers(betNumbers.filter(n => n !== num));
    } else if (betNumbers.length < 12) {
      setBetNumbers([...betNumbers, num].sort((a, b) => a - b));
    }
  };

  // Pick n distinct random numbers from 1..49 (Fisher-Yates), sorted.
  const randomBetNumbers = (n) => {
    const pool = [...Array(49)].map((_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, n).sort((a, b) => a - b);
  };

  const clearBetNumbers = () => {
    setBetNumbers([]);
    setGeneratedWheel([]);
  };

  const getEntryType = (len) => {
    if (len < 6) return `Select ${6 - len} more number(s)`;
    if (len === 6) return 'Ordinary Entry (6)';
    return `System ${len} Entry`;
  };

  const plannerAnalysis = useMemo(() => {
    if (betNumbers.length < 6) return null;
    const sortedDraws = [...activeDraws].sort((a, b) => b.drawNo - a.drawNo);
    const analysis = sortedDraws.map(draw => {
      const drawSet = includeBonus ? [...draw.numbers, draw.additional] : draw.numbers;
      const matches = betNumbers.filter(n => drawSet.includes(n));
      return { draw, matches, count: matches.length };
    });
    const recent10 = analysis.slice(0, 10);
    const recentFiltered = analysis.filter(a => a.count >= 1).slice(0, 10);
    const distribution = {};
    analysis.forEach(a => {
      distribution[a.count] = (distribution[a.count] || 0) + 1;
    });
    return { recent10, recentFiltered, distribution, total: analysis.length };
  }, [activeDraws, betNumbers, includeBonus]);

  const getCombinations = (arr, k) => {
    const results = [];
    const helper = (start, combo) => {
      if (combo.length === k) { results.push([...combo]); return; }
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        helper(i + 1, combo);
        combo.pop();
      }
    };
    helper(0, []);
    return results;
  };

  const roiSimulation = useMemo(() => {
    if (betNumbers.length < 6) return null;
    const combos = getCombinations(betNumbers, 6);
    const costPerDraw = combos.length; // $1 per combination ticket
    let totalSpent = 0;
    let totalWon = 0;
    let wins = { g1: 0, g2: 0, g3: 0, g4: 0, g5: 0, g6: 0, g7: 0 };
    
    activeDraws.forEach(draw => {
      totalSpent += costPerDraw;
      combos.forEach(c => {
        let mainMatches = 0;
        c.forEach(n => { if (draw.numbers.includes(n)) mainMatches++; });
        const hasAdd = c.includes(draw.additional);
        
        if (mainMatches === 6) { wins.g1++; totalWon += 1000000; }
        else if (mainMatches === 5 && hasAdd) { wins.g2++; totalWon += 100000; }
        else if (mainMatches === 5) { wins.g3++; totalWon += 3000; }
        else if (mainMatches === 4 && hasAdd) { wins.g4++; totalWon += 300; }
        else if (mainMatches === 4) { wins.g5++; totalWon += 50; }
        else if (mainMatches === 3 && hasAdd) { wins.g6++; totalWon += 25; }
        else if (mainMatches === 3) { wins.g7++; totalWon += 10; }
      });
    });

    const roi = totalSpent > 0 ? ((totalWon - totalSpent) / totalSpent) * 100 : 0;
    return { totalSpent, totalWon, roi, wins, draws: activeDraws.length };
  }, [activeDraws, betNumbers]);

  const generateWheel = () => {
    if (betNumbers.length < 6) return;
    const pool = betNumbers;
    const n = pool.length;
    if (wheelMode === 'full') {
      const allCombos = getCombinations(pool, 6);
      setGeneratedWheel(allCombos);
      setWheelMeta({
        mode: 'full',
        lines: allCombos.length,
        cost: allCombos.length,
        guarantee: null,
        verified: null,
        fullSystemLines: allCombos.length,
      });
      return;
    }
    // Abbreviated = true covering wheel: guarantee t matches if m of pool are drawn.
    const t = wheelT, m = wheelM;
    if (t > m || t > 6 || t < 1 || m < t || m > n) {
      setGeneratedWheel([]);
      setWheelMeta({ mode: 'abbrev', lines: 0, cost: 0, guarantee: null, verified: false, fullSystemLines: getCombinations(pool, 6).length, error: 'Invalid guarantee (need 1<=t<=m<=pool size, t<=6).' });
      return;
    }
    const popcount = (x) => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
    const idx = {}; pool.forEach((v, i) => { idx[v] = i; });
    const poolMask = (1 << n) - 1;
    // all 6-lines as bitmasks
    const lines = [];
    const pick = (start, k, mask) => {
      if (k === 0) { lines.push(mask); return; }
      for (let i = start; i < n; i++) pick(i + 1, k - 1, mask | (1 << i));
    };
    pick(0, 6, 0);
    // all m-subsets as bitmasks
    const subs = [];
    const pickS = (start, k, mask) => {
      if (k === 0) { subs.push(mask); return; }
      for (let i = start; i < n; i++) pickS(i + 1, k - 1, mask | (1 << i));
    };
    pickS(0, m, 0);
    // greedy: cover every m-subset with >=t overlap to some chosen line
    const uncovered = new Set(subs);
    const chosen = [];
    const MAX_LINES = 300;
    while (uncovered.size > 0 && chosen.length < MAX_LINES) {
      let best = -1, bestCov = -1;
      for (const lineMask of lines) {
        if (chosen.includes(lineMask)) continue;
        let cov = 0;
        for (const s of uncovered) {
          if (popcount(s & lineMask) >= t) cov++;
        }
        if (cov > bestCov) { bestCov = cov; best = lineMask; }
      }
      if (best < 0 || bestCov === 0) break;
      chosen.push(best);
      for (const s of uncovered) { if (popcount(s & best) >= t) uncovered.delete(s); }
    }
    // verify
    const verified = subs.every(s => chosen.some(l => popcount(s & l) >= t));
    const toNums = (mask) => pool.filter((_, i) => (mask >> i) & 1);
    const wheelLines = chosen.map(toNums);
    const fullLines = getCombinations(pool, 6).length;
    setGeneratedWheel(wheelLines);
    setWheelMeta({
      mode: 'abbrev',
      lines: wheelLines.length,
      cost: wheelLines.length,
      guarantee: { t, m },
      verified,
      fullSystemLines: fullLines,
      error: null,
    });
  };

  const frequencyStats = useMemo(() => {
    const counts = Array(50).fill(0);
    activeDraws.forEach(draw => {
      const nums = includeBonus ? [...draw.numbers, draw.additional] : draw.numbers;
      nums.forEach(n => { if (n >= 1 && n <= 49) counts[n]++; });
    });
    const mapped = counts.map((count, num) => ({ num, count })).slice(1);
    return {
      hot: [...mapped].sort((a, b) => b.count - a.count).slice(0, 10),
      cold: [...mapped].sort((a, b) => a.count - b.count).slice(0, 10),
    };
  }, [activeDraws, includeBonus]);

  const coOccurrence = useMemo(() => {
    const matrix = Array.from({ length: 50 }, () => Array(50).fill(0));
    let maxFreq = 0;
    activeDraws.forEach(draw => {
      const nums = includeBonus ? [...draw.numbers, draw.additional] : draw.numbers;
      const safe = nums.filter((n) => n >= 1 && n <= 49);
      for (let i = 0; i < safe.length; i++) {
        for (let j = i + 1; j < safe.length; j++) {
          const a = safe[i];
          const b = safe[j];
          matrix[a][b]++;
          matrix[b][a]++;
          if (matrix[a][b] > maxFreq) maxFreq = matrix[a][b];
        }
      }
    });
    return { matrix, maxFreq };
  }, [activeDraws, includeBonus]);

  const oddEvenStats = useMemo(() => {
    const distribution = {};
    activeDraws.forEach(draw => {
      let odds = 0;
      let evens = 0;
      const nums = includeBonus ? [...draw.numbers, draw.additional] : draw.numbers;
      nums.forEach(n => (n % 2 === 0 ? evens++ : odds++));
      const key = `${odds} Odd / ${evens} Even`;
      distribution[key] = (distribution[key] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([key, count]) => ({ key, count, pct: (count / activeDraws.length) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, [activeDraws, includeBonus]);

  const highLowStats = useMemo(() => {
    const distribution = {};
    activeDraws.forEach(draw => {
      let high = 0; // 25-49
      let low = 0;  // 1-24
      const nums = includeBonus ? [...draw.numbers, draw.additional] : draw.numbers;
      nums.forEach(n => (n >= 25 ? high++ : low++));
      const key = `${high} High / ${low} Low`;
      distribution[key] = (distribution[key] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([key, count]) => ({ key, count, pct: (count / activeDraws.length) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, [activeDraws, includeBonus]);

  const sumStats = useMemo(() => {
    const sums = [];
    const ranges = { '< 100': 0, '100 - 149': 0, '150 - 199': 0, '>= 200': 0 };
    activeDraws.forEach(draw => {
      const nums = includeBonus ? [...draw.numbers, draw.additional] : draw.numbers;
      const sum = nums.reduce((a, b) => a + b, 0);
      sums.push(sum);
      if (sum < 100) ranges['< 100']++;
      else if (sum < 150) ranges['100 - 149']++;
      else if (sum < 200) ranges['150 - 199']++;
      else ranges['>= 200']++;
    });
    const avg = sums.length ? (sums.reduce((a, b) => a + b, 0) / sums.length).toFixed(1) : '0';
    return {
      avg,
      min: sums.length ? Math.min(...sums) : 0,
      max: sums.length ? Math.max(...sums) : 0,
      distribution: Object.entries(ranges).map(([key, count]) => ({ key, count, pct: (activeDraws.length ? (count / activeDraws.length) * 100 : 0) }))
    };
  }, [activeDraws, includeBonus]);

  const parseCSVData = (text) => {
    try {
      setCsvError('');
      setSyncMessage('');
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        setCsvError('CSV file must contain at least a header and draw rows.');
        return;
      }
      
      const parsedDraws = [];
      // Expected parse_toto.py Output: DrawNo,Date,N1,N2,N3,N4,N5,N6,Additional
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length >= 9) {
          const drawNo = parseInt(cols[0], 10);
          const date = cols[1];
          const numbers = [
            parseInt(cols[2], 10), parseInt(cols[3], 10), parseInt(cols[4], 10),
            parseInt(cols[5], 10), parseInt(cols[6], 10), parseInt(cols[7], 10)
          ];
          const additional = parseInt(cols[8], 10);
          
          const draw = { drawNo, date, numbers, additional };
          if (isValidDraw(draw)) {
            parsedDraws.push(draw);
          } else {
            setCsvError(`Skipped row ${i} (draw ${drawNo || '?'}): numbers must be 6 unique integers from 1-49.`);
          }
        }
      }

      if (parsedDraws.length === 0) {
        setCsvError('Could not find valid TOTO draw rows. Ensure your CSV matches the python script output and uses numbers 1-49.');
        return;
      }
      setCustomDataset(parsedDraws);
      setActiveTab('overview');
      setSyncMessage(`Loaded ${parsedDraws.length} draws from CSV.`);
    } catch (err) {
      setCsvError('Failed to parse CSV file. Please verify column formatting.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setCsvRawText(content);
      parseCSVData(content);
    };
    reader.readAsText(file);
  };

  const exportToCSV = () => {
    const sortedDraws = [...activeDraws].sort((a, b) => b.drawNo - a.drawNo);
    const header = "DrawNo,Date,N1,N2,N3,N4,N5,N6,Additional\n";
    const csvContent = sortedDraws.map(draw => 
      `${draw.drawNo},${draw.date},${draw.numbers.join(',')},${draw.additional}`
    ).join('\n');
    
    const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `toto_history_${sortedDraws[0].drawNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePullLatest = () => {
    if (LIVE_SYNC_ENDPOINT) {
      setIsPulling(true);
      setSyncMessage('');
      // Expected response: JSON array of { drawNo, date, numbers:[6], additional } newer than current max.
      fetch(LIVE_SYNC_ENDPOINT)
        .then(r => r.json())
        .then(json => {
          const incoming = Array.isArray(json) ? json : (json.draws || []);
          const valid = incoming.filter(isValidDraw);
          if (valid.length === 0) { setSyncMessage('No new draws returned.'); return; }
          const merged = [...valid, ...activeDraws]
            .sort((a, b) => b.drawNo - a.drawNo)
            .filter((d, idx, arr) => idx === 0 || arr[idx - 1].drawNo !== d.drawNo);
          setCustomDataset(merged);
          setSyncMessage(`Pulled ${valid.length} new draw(s).`);
        })
        .catch(err => setSyncMessage('Live sync failed (CORS/offline). Run parse_toto.py locally and use Import.'))
        .finally(() => setIsPulling(false));
    } else {
      // No hosted endpoint: streamline into local import.
      setActiveTab('data');
      setSyncMessage('Live scraping is blocked in-browser (CORS). Run parse_toto.py locally, then use the Import box below.');
      if (fileInputRef.current) fileInputRef.current.click();
    }
  };

  const resetToDefaultDataset = () => {
    setCustomDataset(null);
    setCsvRawText('');
    setCsvError('');
    setSyncMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-3 sm:p-6 md:p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
                Singapore Pools TOTO Analyzer
              </h1>
              {customDataset ? (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 shadow-lg shadow-emerald-500/10">
                  Custom Database ({customDataset.length} draws)
                </span>
              ) : (
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-1 rounded-full font-semibold shadow-lg shadow-blue-500/10">
                  Singapore Pools Database ({BASE_HISTORICAL_DRAWS.length} draws)
                </span>
              )}
            </div>
            <p className="mt-2 text-slate-400 text-sm max-w-3xl leading-relaxed">
              Analyze historical overlap occurrences, test future bet patterns against past draws, and sync your local CSV records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIncludeBonus(!includeBonus)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border flex items-center gap-2 ${
                includeBonus
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${includeBonus ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`}></span>
              {includeBonus ? '7 Balls (Main + Bonus)' : '6 Balls (Main Only)'}
            </button>

            {customDataset && (
              <button
                onClick={resetToDefaultDataset}
                className="px-3 py-2 rounded-xl text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/50 transition"
              >
                Reset Database
              </button>
            )}
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button onClick={() => setActiveTab('overview')} className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'overview' ? 'border-blue-500 text-blue-400 bg-slate-900/80' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}>
            📊 Analytics & Stats
          </button>
          <button onClick={() => setActiveTab('history')} className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'history' ? 'border-blue-500 text-blue-400 bg-slate-900/80' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}>
            📜 Past Records {datasetStats.total > 0 && <span className="bg-blue-600/30 text-blue-300 text-xs px-2 py-0.5 rounded-full border border-blue-500/30">{datasetStats.total}</span>}
          </button>
          <button onClick={() => setActiveTab('planner')} className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'planner' ? 'border-blue-500 text-blue-400 bg-slate-900/80' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}>
            🎯 Next Bet & ROI
          </button>
          <button onClick={() => setActiveTab('data')} className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'data' ? 'border-amber-500 text-amber-400 bg-slate-900/80' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}>
            📂 Data & Sync
          </button>
        </div>

        {/* TAB 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Pairs Analyzed</span>
                <div className="text-3xl font-extrabold text-white mt-1">{datasetStats.total}</div>
                <span className="text-xs text-slate-500 mt-1 block">Consecutive Draw Intervals</span>
              </div>
              <div onClick={() => handleSelectMatchFilter(3)} className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-5 shadow-lg hover:border-amber-500/60 cursor-pointer transition group">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-amber-400 uppercase tracking-wider font-semibold">3-Match Overlaps</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono group-hover:bg-amber-500/30">View Log →</span>
                </div>
                <div className="text-3xl font-extrabold text-amber-300 mt-1">{datasetStats.counts[3] || 0} <span className="text-lg font-normal text-amber-400/80">({datasetStats.distribution[3]?.percentage.toFixed(1)}%)</span></div>
                <span className="text-xs text-slate-400 mt-1 block">Expected Math: ~2.89% to 3.82%</span>
              </div>
              <div onClick={() => handleSelectMatchFilter(2)} className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg hover:border-slate-700 cursor-pointer transition">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">2-Match Overlaps</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">View Log →</span>
                </div>
                <div className="text-3xl font-extrabold text-emerald-400 mt-1">{datasetStats.counts[2] || 0} <span className="text-lg font-normal text-slate-400">({datasetStats.distribution[2]?.percentage.toFixed(1)}%)</span></div>
                <span className="text-xs text-slate-500 mt-1 block">Expected Math: ~13.2% to 19.6%</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">4+ Rare Matches</span>
                <div className="text-3xl font-extrabold text-rose-400 mt-1">{(datasetStats.counts[4] + datasetStats.counts[5] + datasetStats.counts[6]) || 0}</div>
                <span className="text-xs text-slate-500 mt-1 block">High Overlap Frequency</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Empirical Dataset vs Hypergeometric Theory</h2>
                  <p className="text-sm text-slate-400">Comparing actual consecutive draw matches against mathematical calculations.</p>
                </div>
              </div>
              <div className="space-y-4">
                {datasetStats.distribution.map(({ matches, count, percentage }) => {
                  const theory = (includeBonus ? THEORETICAL_7 : THEORETICAL_6).find(t => t.matches === matches);
                  const theoryPct = theory ? theory.prob : 0;
                  return (
                    <div key={matches} className="space-y-1.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleSelectMatchFilter(matches)} className="font-bold text-slate-200 hover:text-blue-400 transition flex items-center gap-1.5">
                            <span>{matches} Matching Ball{matches !== 1 && 's'}</span>
                            <span className="text-xs text-slate-500 font-normal">({count} times)</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-blue-400 font-semibold">Actual: {percentage.toFixed(2)}%</span>
                          <span className="text-slate-400 font-mono">Theoretical: {theoryPct}%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                        </div>
                        <div className="w-full bg-slate-800/50 h-1 rounded-full overflow-hidden">
                          <div className="bg-amber-500/60 h-full rounded-full" style={{ width: `${Math.min(theoryPct, 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: History */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
                <span className="text-xs text-slate-400 mr-2 font-semibold uppercase">Filter Overlap:</span>
                <button onClick={() => setSelectedMatchFilter(null)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${selectedMatchFilter === null ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>All ({datasetStats.total})</button>
                {[0, 1, 2, 3, 4, 5, 6].map(num => (
                  <button key={num} onClick={() => setSelectedMatchFilter(num)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${selectedMatchFilter === num ? num === 3 ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                    {num} Match{num !== 1 && 'es'} ({datasetStats.counts[num] || 0})
                  </button>
                ))}
              </div>
              <div className="w-full md:w-64">
                <input type="text" placeholder="Search draw # or date..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="space-y-4">
              {filteredPairs.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">No consecutive draw occurrences matched your selected filter.</div>
              ) : (
                filteredPairs.map((pair) => (
                  <div key={pair.pairId} className={`bg-slate-900 border rounded-xl p-5 shadow-lg transition-all ${pair.matchCount >= 3 ? 'border-amber-500/40 bg-amber-950/10' : pair.matchCount === 2 ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/80 opacity-90'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${pair.matchCount >= 3 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'}`}>{pair.matchCount} Overlapping Ball{pair.matchCount !== 1 && 's'}</span>
                        <span className="text-xs text-slate-400 font-mono">Draw #{pair.prior.drawNo} ➔ Draw #{pair.current.drawNo}</span>
                      </div>
                      {pair.matches.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Matched:</span>
                          <div className="flex gap-1">{pair.matches.map(m => <span key={m} className="bg-amber-400 text-slate-950 font-bold text-base w-9 h-9 rounded-full flex items-center justify-center shadow">{m}</span>)}</div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Prior Draw */}
                      <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/60">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-slate-400">Prior Draw #{pair.prior.drawNo}</span>
                          <span className="text-xs text-slate-500">{pair.prior.date}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {pair.prior.numbers.map(n => <span key={n} className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold border transition ${pair.matches.includes(n) ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/30 shadow-lg scale-105' : getBallStyle(n)}`}>{n}</span>)}
                          {includeBonus && <div className="flex items-center ml-1 border-l border-slate-800 pl-2"><span className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold border ${pair.matches.includes(pair.prior.additional) ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/30 shadow-lg' : 'bg-slate-800 text-slate-300 border-amber-500/50'}`}>{pair.prior.additional}</span></div>}
                        </div>
                      </div>
                      {/* Subsequent Draw */}
                      <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/60">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-slate-400">Subsequent Draw #{pair.current.drawNo}</span>
                          <span className="text-xs text-slate-500">{pair.current.date}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {pair.current.numbers.map(n => <span key={n} className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold border transition ${pair.matches.includes(n) ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/30 shadow-lg scale-105' : getBallStyle(n)}`}>{n}</span>)}
                          {includeBonus && <div className="flex items-center ml-1 border-l border-slate-800 pl-2"><span className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold border ${pair.matches.includes(pair.current.additional) ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/30 shadow-lg' : 'bg-slate-800 text-slate-300 border-amber-500/50'}`}>{pair.current.additional}</span></div>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Next Bet & ROI Planner (incl. Wheeling System) */}
        {activeTab === 'planner' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Next Bet Planner & Simulator</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Select between 6 to 15 numbers to simulate a bet. We will calculate historical ROI against all draws loaded in the database.
                  </p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <div className={`px-4 py-2 rounded-xl border font-bold shadow-lg transition-colors ${betNumbers.length >= 6 ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' : 'bg-slate-800/80 text-slate-400 border-slate-700'}`}>
                    {getEntryType(betNumbers.length)}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-slate-500">{betNumbers.length} / 12 max selected</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => setBetNumbers(randomBetNumbers(6))} className="px-2 py-1 text-xs rounded border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition">Ordinary</button>
                      {[7,8,9,10,11,12].map(sys => (
                        <button key={sys} onClick={() => setBetNumbers(randomBetNumbers(sys))} className="px-2 py-1 text-xs rounded border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition">System {sys}</button>
                      ))}
                    </div>
                    {betNumbers.length > 0 && <button onClick={clearBetNumbers} className="text-xs text-rose-400 hover:text-rose-300 transition underline">Clear All</button>}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-800/60 p-4 sm:p-6 rounded-xl">
                <div className="grid grid-cols-7 gap-1.5 min-[400px]:gap-2 sm:gap-3 max-w-3xl mx-auto">
                  {Array.from({ length: 49 }, (_, i) => i + 1).map((num) => {
                    const isSelected = betNumbers.includes(num);
                    return (
                      <button key={num} onClick={() => toggleBetNumber(num)} className={`aspect-square rounded-full flex items-center justify-center text-lg sm:text-xl font-bold transition-all border-2 ${isSelected ? 'bg-blue-600 text-white border-blue-400 ring-4 ring-blue-500/30 scale-110 shadow-lg shadow-blue-900/50 z-10' : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-700 hover:border-slate-500'}`}>
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {roiSimulation && (
              <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl animate-in fade-in duration-500">
                <h3 className="text-lg font-bold text-white mb-2 border-b border-slate-800 pb-3 flex items-center gap-2">💰 ROI & Prize Simulator</h3>
                <p className="text-xs text-slate-400 mb-6">If you played this exact System {betNumbers.length} combination consistently over the last <strong>{roiSimulation.draws}</strong> recorded draws.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-center shadow-inner">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Total Spent</span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2 font-mono">${roiSimulation.totalSpent.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-center shadow-inner">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Total Won (Est.)</span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2 font-mono">${roiSimulation.totalWon.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-center shadow-inner">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Net ROI</span>
                    <div className={`text-2xl sm:text-3xl font-extrabold mt-2 font-mono ${roiSimulation.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {roiSimulation.roi > 0 ? '+' : ''}{roiSimulation.roi.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  <PrizeBox title="Group 1" desc="6 Main" count={roiSimulation.wins.g1} isHigh={true} />
                  <PrizeBox title="Group 2" desc="5 + Add" count={roiSimulation.wins.g2} isHigh={true} />
                  <PrizeBox title="Group 3" desc="5 Main" count={roiSimulation.wins.g3} isHigh={true} />
                  <PrizeBox title="Group 4" desc="4 + Add" count={roiSimulation.wins.g4} isHigh={false} />
                  <PrizeBox title="Group 5" desc="4 Main" count={roiSimulation.wins.g5} isHigh={false} />
                  <PrizeBox title="Group 6" desc="3 + Add" count={roiSimulation.wins.g6} isHigh={false} />
                  <PrizeBox title="Group 7" desc="3 Main" count={roiSimulation.wins.g7} isHigh={false} />
                </div>
              </div>
            )}

            {plannerAnalysis && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                  <h3 className="text-2xl font-bold text-white mb-4 border-b border-slate-800 pb-3 flex items-center gap-2">🕒 Most Recent Draws Overlap (≥1 match)</h3>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {[1,2,3].map(f => (
                      <button key={f} onClick={() => setRecentFilter(f)} className={`px-2.5 py-1 text-xs rounded border transition ${recentFilter === f ? 'bg-blue-600 border-blue-500 text-white font-semibold' : 'border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}>{f === 1 ? 'All (≥1)' : `≥${f} matches`}</button>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {plannerAnalysis.recentFiltered.length === 0 ? (
                      <div className="text-sm text-slate-500 py-6 text-center">No recent draws with {recentFilter === 1 ? 'a match' : `${recentFilter}+ matches`} for your current selection.</div>
                    ) : plannerAnalysis.recentFiltered.map(({ draw, matches, count }) => (
                      <div key={draw.drawNo} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition ${count >= 3 ? 'bg-amber-950/20 border-amber-900/50' : 'bg-slate-950/50 border-slate-800/50'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-lg font-semibold text-slate-200">Draw #{draw.drawNo}</span>
                            <span className="text-sm text-slate-500">{draw.date}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            {draw.numbers.map(n => <span key={n} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${matches.includes(n) ? 'bg-amber-400 text-slate-900 ring-1 ring-amber-300 shadow-sm scale-110 z-10' : 'bg-slate-800 text-slate-400'}`}>{n}</span>)}
                            {includeBonus && <div className="flex items-center ml-1 border-l border-slate-700 pl-1.5"><span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${matches.includes(draw.additional) ? 'bg-amber-400 text-slate-900 ring-1 ring-amber-300 shadow-sm scale-110 z-10' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>{draw.additional}</span></div>}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className={`inline-block px-2.5 py-1 rounded text-base font-bold ${count >= 4 ? 'bg-rose-500/20 text-rose-400' : count === 3 ? 'bg-amber-500/20 text-amber-400' : count > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>{count} Match{count !== 1 && 'es'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-3 flex items-center gap-2">📊 All-Time Overlap Summary</h3>
                  <div className="flex-1 space-y-2 mt-2">
                    {Object.keys(plannerAnalysis.distribution).map(Number).sort((a, b) => b - a).map(matchLvl => {
                        const count = plannerAnalysis.distribution[matchLvl];
                        const pct = ((count / plannerAnalysis.total) * 100).toFixed(1);
                        return (
                          <div key={matchLvl} className={`flex items-center justify-between p-2 rounded hover:bg-slate-800/50 transition ${matchLvl >= 4 ? 'bg-rose-950/20 border border-rose-900/30' : ''}`}>
                            <span className={`text-sm font-semibold ${matchLvl >= 4 ? 'text-rose-400' : matchLvl === 3 ? 'text-amber-400' : 'text-slate-300'}`}>{matchLvl} Match{matchLvl !== 1 && 'es'}</span>
                            <div className="text-right flex flex-col"><span className="text-sm font-bold text-slate-100">{count}x</span><span className="text-[10px] text-slate-500">{pct}%</span></div>
                          </div>
                        );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Wheeling System Generator - nested, reuses the betNumbers selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-3xl font-bold text-white">🎡 Wheeling System Generator</h2>
                <p className="text-lg text-slate-400 mt-1">
                  {betNumbers.length >= 6
                    ? `Building combinations from the ${betNumbers.length} numbers you selected above. Full System plays every 6-line; Abbreviated is a true covering wheel that guarantees a minimum win tier.`
                    : 'Select at least 6 numbers above using the shared selector to generate wheeling combinations.'}
                </p>
              </div>

              {betNumbers.length >= 6 ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner sm:flex-1">
                      <h3 className="text-lg font-bold text-slate-200 mb-2">Pool ({betNumbers.length} numbers)</h3>
                      <p className="text-base text-slate-500 mb-3 break-words">{betNumbers.join(', ')}</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setWheelMode('full'); setGeneratedWheel([]); setWheelMeta(null); }} className={`flex-1 py-1.5 text-base font-semibold rounded transition ${wheelMode === 'full' ? 'bg-emerald-600 border border-emerald-500 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'}`}>Full System</button>
                        <button onClick={() => { setWheelMode('abbrev'); setGeneratedWheel([]); setWheelMeta(null); }} className={`flex-1 py-1.5 text-base font-semibold rounded transition ${wheelMode === 'abbrev' ? 'bg-emerald-600 border border-emerald-500 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'}`}>Abbreviated (Covering)</button>
                      </div>
                    </div>
                  </div>

                  {wheelMode === 'abbrev' && (
                    <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                      <p className="text-sm text-slate-400">Set the guarantee: <span className="text-slate-200 font-semibold">if {wheelM} of your {betNumbers.length} numbers are drawn, you are guaranteed at least {wheelT} matching</span> in some line.</p>
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-slate-400">
                          Guarantee matches (t):
                          <select value={wheelT} onChange={(e) => { setWheelT(Number(e.target.value)); setGeneratedWheel([]); setWheelMeta(null); }} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100">
                            {[1,2,3,4,5,6].filter(v => v <= wheelM).map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-400">
                          If drawn (m):
                          <select value={wheelM} onChange={(e) => { setWheelM(Number(e.target.value)); setGeneratedWheel([]); setWheelMeta(null); }} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100">
                            {Array.from({length: betNumbers.length - 2}, (_, i) => i + 3).filter(v => v >= 3 && v <= betNumbers.length).map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </label>
                      </div>
                    </div>
                  )}

                  <button onClick={generateWheel} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-lg font-bold transition shadow-lg shadow-emerald-600/30">
                    Generate Lines
                  </button>

                  {wheelMeta && wheelMeta.error && (
                    <div className="bg-rose-950/40 border border-rose-800/50 rounded-lg p-3 text-sm text-rose-300">{wheelMeta.error}</div>
                  )}

                  {wheelMeta && !wheelMeta.error && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Lines / Cost</div>
                        <div className="text-2xl font-extrabold text-white mt-1">{wheelMeta.lines} <span className="text-sm font-normal text-slate-400">@ S$1 = S${wheelMeta.cost}</span></div>
                      </div>
                      <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                        <div className="text-xs text-slate-500 uppercase tracking-wider">{wheelMode === 'abbrev' ? 'Full System (vs)' : 'This is'}</div>
                        <div className="text-2xl font-extrabold text-slate-300 mt-1">{wheelMeta.fullSystemLines} <span className="text-sm font-normal text-slate-500">lines</span></div>
                        {wheelMode === 'abbrev' && <div className="text-xs text-emerald-400 mt-1">You save S${wheelMeta.fullSystemLines - wheelMeta.lines}</div>}
                      </div>
                      <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Guarantee</div>
                        {wheelMeta.guarantee ? (
                          <div className="text-base font-bold text-amber-300 mt-1">≥{wheelMeta.guarantee.t} if {wheelMeta.guarantee.m} hit</div>
                        ) : (
                          <div className="text-base font-bold text-slate-300 mt-1">All {wheelMeta.lines} lines</div>
                        )}
                        {wheelMeta.verified === true && <div className="text-xs text-emerald-400 mt-1">✓ verified ({wheelMeta.fullSystemLines >= 0 ? 'covering holds' : ''})</div>}
                        {wheelMeta.verified === false && <div className="text-xs text-rose-400 mt-1">✗ not fully covered</div>}
                      </div>
                    </div>
                  )}

                  {wheelMode === 'abbrev' && wheelMeta && wheelMeta.guarantee && !wheelMeta.error && (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Risk/Reward: this wheel guarantees a floor (Group {wheelMeta.guarantee.t === 3 ? '7 (S$10)' : wheelMeta.guarantee.t === 4 ? '5 (S$50)' : wheelMeta.guarantee.t === 5 ? '3 (5.5% pool)' : wheelMeta.guarantee.t === 6 ? '1 (jackpot)' : wheelMeta.guarantee.t + '-match'}) only <span className="text-slate-300">if {wheelMeta.guarantee.m} of your chosen numbers are among the 6 drawn</span>. It covers the 6 MAIN numbers only — it does not cover the Additional Number (Groups 2/4/6). Expected value stays negative (54% of stake funds the prize pool); the wheel improves your <span className="text-slate-300">coverage floor</span>, not your expected return.
                    </p>
                  )}

                  {generatedWheel.length > 0 && (
                    <div className="border-t border-slate-800 pt-6 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Generated Lines ({generatedWheel.length} combinations - ${generatedWheel.length})</h3>
                        <button onClick={() => { const text = generatedWheel.map((line, i) => `#${i+1}: ${line.join(' ')}`).join('\n'); navigator.clipboard.writeText(text).then(() => setCopyMsg('Copied!')).catch(() => setCopyMsg('Copy failed')); setTimeout(() => setCopyMsg(''), 2000); }} className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition shrink-0">
                          {copyMsg || 'Copy all'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {generatedWheel.map((line, idx) => (
                          <div key={idx} className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-lg flex justify-between items-center shadow-sm">
                            <span className="text-slate-500 text-sm font-mono mr-2">#{idx+1}</span>
                            <div className="flex gap-1.5">
                              {line.map(n => <span key={n} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">{n}</span>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-950/50 border border-dashed border-slate-700 rounded-xl p-8 text-center text-slate-500 text-sm">
                  Select at least 6 numbers in the selector above to activate the wheeling generator.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4 (moved): Stats & Matrices */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Frequency Heatmap Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white">Hot & Cold Heatmap</h2>
              <p className="text-xs text-slate-400 mt-1 mb-6">Most and least frequently drawn numbers in the dataset.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-950/50 p-5 rounded-xl border border-rose-900/40 shadow-inner">
                  <h3 className="text-rose-400 font-bold mb-4 flex items-center gap-2">🔥 Top 10 Hot Numbers</h3>
                  <div className="flex flex-wrap gap-4">
                    {frequencyStats.hot.map(n => (
                      <div key={n.num} className="flex flex-col items-center gap-1.5"><span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border shadow-md ${getBallStyle(n.num)}`}>{n.num}</span><span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{n.count}x</span></div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-950/50 p-5 rounded-xl border border-blue-900/40 shadow-inner">
                  <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2">🧊 Top 10 Cold Numbers</h3>
                  <div className="flex flex-wrap gap-4">
                    {frequencyStats.cold.map(n => (
                      <div key={n.num} className="flex flex-col items-center gap-1.5"><span className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border bg-slate-800 text-slate-400 border-slate-700 shadow-md opacity-80">{n.num}</span><span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{n.count}x</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Co-Occurrence Matrix Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white">Co-Occurrence Matrix</h2>
              <p className="text-xs text-slate-400 mt-1 mb-4">Heatmap showing how often any two numbers are drawn together in the same draw.</p>
              <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <div className="inline-block min-w-max">
                  {/* Header Row */}
                  <div className="flex">
                    <div className="w-8 h-8"></div>
                    {Array.from({length: 49}, (_, i) => i + 1).map(n => <div key={`hdr-${n}`} className="w-7 h-7 flex items-center justify-center text-xs font-bold text-slate-500">{n}</div>)}
                  </div>
                  {/* Matrix Rows */}
                  {Array.from({length: 49}, (_, i) => i + 1).map(rowNum => (
                    <div key={`row-${rowNum}`} className="flex">
                      <div className="w-8 h-7 flex items-center justify-end pr-2 text-xs text-slate-400 font-bold">{rowNum}</div>
                      {Array.from({length: 49}, (_, j) => j + 1).map(colNum => {
                        const val = coOccurrence.matrix[rowNum][colNum];
                        const intensity = coOccurrence.maxFreq > 0 ? val / coOccurrence.maxFreq : 0;
                        return (
                          <div key={`cell-${rowNum}-${colNum}`} className="w-7 h-7 border border-slate-900/80 flex items-center justify-center text-xs font-mono transition-colors hover:border-amber-400" style={{
                            backgroundColor: rowNum === colNum ? 'rgba(15, 23, 42, 0.5)' : `rgba(245, 158, 11, ${intensity * 0.95})`,
                            color: val > 0 && intensity > 0.35 ? '#fff' : 'rgba(255,255,255,0.15)'
                          }}>
                            {val > 0 && rowNum !== colNum ? val : ''}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Odd/Even and High/Low Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-6">Odd / Even Ratio</h2>
                <div className="space-y-5 max-w-3xl mx-auto">
                  {oddEvenStats.map(stat => (
                    <div key={stat.key} className="space-y-2">
                      <div className="flex justify-between text-sm items-end"><span className="text-slate-200 font-bold">{stat.key}</span><span className="text-violet-400 font-mono text-xs">{stat.count} draws ({stat.pct.toFixed(1)}%)</span></div>
                      <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden shadow-inner"><div className="bg-violet-500 h-full rounded-full transition-all duration-500" style={{ width: `${stat.pct}%` }}></div></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-6">High / Low Ratio</h2>
                <div className="space-y-5 max-w-3xl mx-auto">
                  {highLowStats.map(stat => (
                    <div key={stat.key} className="space-y-2">
                      <div className="flex justify-between text-sm items-end"><span className="text-slate-200 font-bold">{stat.key}</span><span className="text-cyan-400 font-mono text-xs">{stat.count} draws ({stat.pct.toFixed(1)}%)</span></div>
                      <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden shadow-inner"><div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${stat.pct}%` }}></div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sum Analysis */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6">Total Sum Analysis</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-center shadow-inner"><span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Average Sum</span><div className="text-3xl font-extrabold text-pink-400 mt-2 font-mono">{sumStats.avg}</div></div>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-center shadow-inner"><span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Lowest Sum</span><div className="text-3xl font-extrabold text-slate-300 mt-2 font-mono">{sumStats.min}</div></div>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-center shadow-inner"><span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Highest Sum</span><div className="text-3xl font-extrabold text-slate-300 mt-2 font-mono">{sumStats.max}</div></div>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-6 border border-slate-800/80">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 border-b border-slate-800 pb-2">Sum Distribution Ranges</h3>
                <div className="space-y-5">
                  {sumStats.distribution.map(stat => (
                    <div key={stat.key} className="space-y-2">
                      <div className="flex justify-between text-sm items-end"><span className="text-slate-200 font-bold">Sum {stat.key}</span><span className="text-pink-400 font-mono text-xs">{stat.count} draws ({stat.pct.toFixed(1)}%)</span></div>
                      <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden shadow-inner"><div className="bg-pink-500 h-full rounded-full transition-all duration-500" style={{ width: `${stat.pct}%` }}></div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Data & Sync */}
        {activeTab === 'data' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {syncMessage && (
              <div className={`p-3 rounded-lg text-xs border ${syncMessage.includes('fail') || syncMessage.includes('CORS') ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'}`}>
                {syncMessage}
              </div>
            )}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white">Database Management</h2>
              <p className="text-xs text-slate-400 mt-1">Keep your historical records up-to-date. Pull the latest results or export your dataset.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-slate-950/50 border border-slate-800/80 p-5 rounded-xl flex flex-col items-start justify-between gap-4 h-full">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">🔄 Pull Latest Results</h3>
                    <p className="text-xs text-slate-500 mt-2">
                      {LIVE_SYNC_ENDPOINT
                        ? 'Fetches the newest draws from the hosted scraper (Cloud Run) and merges them into the database.'
                        : 'Opens the local CSV import so you can load fresh data generated by parse_toto.py. In-browser scraping of the official site is blocked by CORS.'}
                    </p>
                  </div>
                  <button onClick={handlePullLatest} disabled={isPulling} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-600/30 transition disabled:opacity-50 flex justify-center items-center gap-2">
                    {isPulling ? <span className="animate-spin text-xl">↻</span> : <span>⬇️</span>}
                    {isPulling ? 'Pulling...' : 'Pull Latest Results'}
                  </button>
                </div>
                <div className="bg-slate-950/50 border border-slate-800/80 p-5 rounded-xl flex flex-col items-start justify-between gap-4 h-full">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">💾 Export Dataset</h3>
                    <p className="text-xs text-slate-500 mt-2">Download your currently loaded database (including any imported draws) to a CSV file on your device.</p>
                  </div>
                  <button onClick={exportToCSV} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-emerald-600/30 transition flex justify-center items-center gap-2">
                    <span>📥</span> Export to CSV
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Import Custom Data</h3>
                <p className="text-xs text-slate-400 mt-1">Upload the <code className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-amber-300 font-mono">toto_official.csv</code> generated by your local python script, or paste the raw output below.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 rounded-xl p-8 text-center bg-slate-950/40 cursor-pointer transition flex flex-col items-center justify-center space-y-3">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.txt" className="hidden" />
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-xl font-bold">📂</div>
                  <div className="text-sm font-semibold text-slate-200">Click to select CSV File</div>
                  <span className="text-xs text-slate-500">Format: DrawNo, Date, N1, N2, N3, N4, N5, N6, Additional</span>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold uppercase">Or Paste Raw CSV Data:</label>
                  <textarea rows={6} value={csvRawText} onChange={(e) => { setCsvRawText(e.target.value); parseCSVData(e.target.value); }} placeholder="DrawNo,Date,N1,N2,N3,N4,N5,N6,Additional&#10;4205,2026-08-03,9,29,30,35,36,40,11" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              {csvError && <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-lg text-xs">{csvError}</div>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function TotoAnalyzer() {
  return (
    <ErrorBoundary>
      <TotoAnalyzerApp />
    </ErrorBoundary>
  );
}
