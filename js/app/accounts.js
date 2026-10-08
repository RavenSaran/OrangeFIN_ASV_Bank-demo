/* Customer account master shared by every module: one record per account, with its signing mandate and the specimen signatories.
   An account that two modules use (for example a company that pays suppliers and sends transfers) is stored once. */
(function () {
  window.APP.ACCOUNTS = [
    {
      no: "8001-2345-6789",
      name: "ABC Sdn. Bhd.",
      kind: "current",
      status: "Active",
      branch: "KL01",
      since: "2018-06-12",
      specimenDate: "2024-02-19",
      mandate: { rule: "any", n: 2, text: "Any 2 of 3 authorised signatories" },
      parties: [
        { id: "p1", name: "Tan Wei Ming", role: "Director", seed: 11 },
        { id: "p2", name: "Siti Nurhaliza Aziz", role: "Finance Director", seed: 23 },
        { id: "p3", name: "Rajesh Kumar", role: "General Manager", seed: 37 }
      ]
    },
    {
      no: "8003-1120-5534",
      name: "Sunrise Logistics Sdn. Bhd.",
      kind: "current",
      status: "Active",
      branch: "PJ02",
      since: "2020-11-23",
      specimenDate: "2022-05-09",
      mandate: { rule: "all", text: "Both authorised signatories together" },
      parties: [
        { id: "p1", name: "Lau Kok Seng", role: "Director", seed: 120 },
        { id: "p2", name: "Nadia Binti Karim", role: "Director", seed: 133 }
      ]
    },
    {
      no: "8004-7781-2290",
      name: "Mega Build Sdn. Bhd.",
      kind: "current",
      status: "Active",
      branch: "KL01",
      since: "2012-09-04",
      specimenDate: "2025-01-14",
      mandate: {
        rule: "any",
        n: 2,
        tier: {
          limit: 50000,
          n: 1
        },
        text: "Any 1 signatory up to MYR 50,000; any 2 above"
      },
      parties: [
        { id: "p1", name: "Ong Boon Hock", role: "Managing Director", seed: 146 },
        { id: "p2", name: "Shalini Menon", role: "Finance Controller", seed: 159 },
        { id: "p3", name: "Kamal Arifin", role: "Project Director", seed: 172 }
      ]
    },
    {
      no: "8005-9930-1178",
      name: "Eastern Foods Bhd.",
      kind: "current",
      status: "Active",
      branch: "PG03",
      since: "2009-01-15",
      specimenDate: "2021-10-01",
      mandate: { rule: "any", n: 2, text: "Any 2 of 4 authorised signatories" },
      parties: [
        { id: "p1", name: "Yeoh Beng Hwa", role: "Chairman", seed: 185 },
        { id: "p2", name: "Farah Diyana", role: "CFO", seed: 198 },
        { id: "p3", name: "Gurdeep Singh", role: "Director", seed: 211 },
        { id: "p4", name: "Tay Li Ying", role: "Treasurer", seed: 224 }
      ]
    },
    {
      no: "7002-8891-4402",
      name: "Borneo Marine Supplies Sdn. Bhd.",
      kind: "current",
      status: "Active",
      branch: "KCH04",
      since: "2015-03-02",
      specimenDate: "2023-08-30",
      mandate: { rule: "any", n: 2, text: "Any 2 of 3 authorised signatories" },
      parties: [
        { id: "p1", name: "Ahmad Faris Hassan", role: "Managing Director", seed: 81 },
        { id: "p2", name: "Chong Siew Lan", role: "Finance Manager", seed: 94 },
        { id: "p3", name: "Daniel Ong", role: "Operations Director", seed: 107 }
      ]
    },
    {
      no: "7007-3351-0902",
      name: "Golden Palm Exports Sdn. Bhd.",
      kind: "current",
      status: "Dormant",
      branch: "KL01",
      since: "2016-07-19",
      specimenDate: "2019-04-22",
      mandate: { rule: "any", n: 2, text: "Any 2 of 2 authorised signatories" },
      parties: [
        { id: "p1", name: "Hasnah Ibrahim", role: "Director", seed: 237 },
        { id: "p2", name: "Lee Chun Wai", role: "Director", seed: 245 }
      ]
    },
    {
      no: "7010-2201-7743",
      name: "Straits Electronics Sdn. Bhd.",
      kind: "current",
      status: "Active",
      branch: "PJ02",
      since: "2017-04-10",
      specimenDate: "2024-06-03",
      mandate: { rule: "any", n: 2, text: "Any 2 of 3 authorised signatories" },
      parties: [
        { id: "p1", name: "Goh Kian Seng", role: "Managing Director", seed: 350 },
        { id: "p2", name: "Mariam Binti Jaafar", role: "Finance Director", seed: 363 },
        { id: "p3", name: "Vikram Nair", role: "Procurement Director", seed: 376 }
      ]
    },
    {
      no: "7011-6650-1908",
      name: "Pacific Timber Sdn. Bhd.",
      kind: "current",
      status: "Active",
      branch: "KCH04",
      since: "2019-09-17",
      specimenDate: "2023-01-25",
      mandate: {
        rule: "any",
        n: 2,
        tier: {
          limit: 100000,
          n: 1
        },
        text: "Any 1 signatory up to MYR 100,000; any 2 above"
      },
      parties: [
        { id: "p1", name: "Lee Sing Hock", role: "Managing Director", seed: 389 },
        { id: "p2", name: "Rosalind Jinggut", role: "Finance Manager", seed: 402 }
      ]
    },
    {
      no: "7012-4488-3302",
      name: "Kinabalu Trading Sdn. Bhd.",
      kind: "current",
      status: "Active",
      branch: "KL01",
      since: "2021-02-08",
      specimenDate: "2022-11-14",
      mandate: { rule: "all", text: "Both authorised signatories together" },
      parties: [
        { id: "p1", name: "Jasmine Wong", role: "Director", seed: 415 },
        { id: "p2", name: "Mohd Hafizuddin", role: "Director", seed: 428 }
      ]
    },
    {
      no: "FD-5521-009876",
      name: "Lim Chee Keong and Lim Mei Ling",
      kind: "fd",
      status: "Active",
      branch: "KL01",
      since: "2021-03-14",
      specimenDate: "2021-03-14",
      currency: "MYR",
      mandate: { rule: "all", text: "Joint account, both holders must sign" },
      parties: [
        { id: "p1", name: "Lim Chee Keong", role: "Primary holder", seed: 52 },
        { id: "p2", name: "Lim Mei Ling", role: "Joint holder", seed: 68 }
      ],
      principal: 100000,
      accrued: 1840.55,
      maturity: "2027-03-14",
      rate: "3.35% p.a."
    },
    {
      no: "FD-5521-010442",
      name: "Wong Ah Seng",
      kind: "fd",
      status: "Active",
      branch: "PJ02",
      since: "2022-08-01",
      specimenDate: "2022-08-01",
      currency: "MYR",
      mandate: { rule: "any", n: 1, text: "Sole holder" },
      parties: [
        { id: "p1", name: "Wong Ah Seng", role: "Sole holder", seed: 250 }
      ],
      principal: 250000,
      accrued: 5210,
      maturity: "2026-12-01",
      rate: "3.50% p.a."
    },
    {
      no: "FD-5521-013055",
      name: "Nur Aisyah Binti Omar and Omar Bin Yusof",
      kind: "fd",
      status: "Active",
      branch: "PG03",
      since: "2023-02-20",
      specimenDate: "2023-02-20",
      currency: "MYR",
      mandate: { rule: "any", n: 1, text: "Joint account, either holder may sign" },
      parties: [
        { id: "p1", name: "Nur Aisyah Binti Omar", role: "Primary holder", seed: 263 },
        { id: "p2", name: "Omar Bin Yusof", role: "Joint holder", seed: 276 }
      ],
      principal: 80000,
      accrued: 1330.2,
      maturity: "2027-02-20",
      rate: "3.40% p.a."
    },
    {
      no: "FD-5522-001208",
      name: "Chen Mei Fong",
      kind: "fd",
      status: "Active",
      branch: "KCH04",
      since: "2024-05-06",
      specimenDate: "2024-05-06",
      currency: "USD",
      mandate: { rule: "any", n: 1, text: "Sole holder" },
      parties: [
        { id: "p1", name: "Chen Mei Fong", role: "Sole holder", seed: 289 }
      ],
      principal: 30000,
      accrued: 410.3,
      maturity: "2026-11-06",
      rate: "2.10% p.a."
    },
    {
      no: "FD-5523-004411",
      name: "Tan Siew Mei",
      kind: "fd",
      status: "Active",
      branch: "KL01",
      since: "2024-11-02",
      specimenDate: "2024-11-02",
      currency: "MYR",
      mandate: { rule: "any", n: 1, text: "Sole holder" },
      parties: [
        { id: "p1", name: "Tan Siew Mei", role: "Sole holder", seed: 300 }
      ],
      principal: 500000,
      accrued: 12040,
      maturity: "2027-05-02",
      rate: "3.55% p.a."
    },
    {
      no: "FD-5523-007788",
      name: "Ahmad Zulkifli Bin Hamid and Rohani Binti Ali",
      kind: "fd",
      status: "Active",
      branch: "PJ02",
      since: "2025-10-12",
      specimenDate: "2025-10-12",
      currency: "MYR",
      mandate: { rule: "all", text: "Joint account, both holders must sign" },
      parties: [
        { id: "p1", name: "Ahmad Zulkifli Bin Hamid", role: "Primary holder", seed: 313 },
        { id: "p2", name: "Rohani Binti Ali", role: "Joint holder", seed: 326 }
      ],
      principal: 150000,
      accrued: 2980.4,
      maturity: "2026-10-12",
      rate: "3.30% p.a."
    },
    {
      no: "FD-5520-000912",
      name: "Yusof Bin Hashim",
      kind: "fd",
      status: "Closed",
      branch: "KL01",
      since: "2019-06-18",
      specimenDate: "2019-06-18",
      currency: "MYR",
      mandate: { rule: "any", n: 1, text: "Sole holder" },
      parties: [
        { id: "p1", name: "Yusof Bin Hashim", role: "Sole holder", seed: 339 }
      ],
      principal: 0,
      accrued: 0,
      maturity: "2024-06-18",
      rate: "3.00% p.a."
    }
  ];
})();
