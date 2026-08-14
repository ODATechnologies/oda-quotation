// ──────────────────────────────────────────
// 공급자 (ODA Technologies) 담당자 목록
// ──────────────────────────────────────────
export const INITIAL_STAFF = [
  { id: 1, name: "마케팅전략기획부 / 강민렬 수석", phone: "010-2773-5445", dept: "마케팅전략기획부" },
  { id: 2, name: "영업부 / 김철수 대리",           phone: "010-0000-0001", dept: "영업부" },
  { id: 3, name: "기술지원부 / 박영희 과장",        phone: "010-0000-0002", dept: "기술지원부" },
];

// ──────────────────────────────────────────
// 거래처 (CUSTOMER) 목록
// ──────────────────────────────────────────
export const INITIAL_CUSTOMERS = [
  {
    id: 1,
    company: "삼성전자",
    contacts: [
      { name: "이재용 프로",   phone: "010-1234-1234", email: "jy.lee@samsung.com" },
      { name: "김민수 책임",   phone: "010-2345-2345", email: "ms.kim@samsung.com" },
    ],
  },
  {
    id: 2,
    company: "LG전자",
    contacts: [
      { name: "박지성 선임",   phone: "010-3456-3456", email: "js.park@lge.com" },
    ],
  },
  {
    id: 3,
    company: "현대자동차",
    contacts: [
      { name: "정몽구 팀장",   phone: "010-4567-4567", email: "mg.jung@hyundai.com" },
      { name: "이순신 수석",   phone: "010-5678-5678", email: "ss.lee@hyundai.com" },
    ],
  },
];

// ──────────────────────────────────────────
// 품목 마스터 (규격 → 소비자가 & 사양)
// ──────────────────────────────────────────
export const INITIAL_PRODUCTS = [
  {
    id: 1,
    category: "Programmable DC Power Supply",
    specs: [
      {
        id: "ps-1",
        spec: "EX80-22.5",
        listPrice: 100000000,
        details: [
          "DC Output : 0~80V / 0~22.5A 1Channel",
          "Display Resolution : 4 Digit",
          "AC Input : 220V / 60Hz",
          "RS-232C, RS-485 통신 기본장착 (TCP/IP 옵션)",
        ],
      },
      {
        id: "ps-2",
        spec: "EX150-15",
        listPrice: 120000000,
        details: [
          "DC Output : 0~150V / 0~15A 1Channel",
          "Display Resolution : 4 Digit",
          "AC Input : 220V / 60Hz",
          "RS-232C, RS-485 통신 기본장착",
        ],
      },
      {
        id: "ps-3",
        spec: "EX300-10",
        listPrice: 150000000,
        details: [
          "DC Output : 0~300V / 0~10A 1Channel",
          "Display Resolution : 4 Digit",
          "AC Input : 220V / 60Hz",
          "RS-232C, RS-485 통신 기본장착",
        ],
      },
    ],
  },
  {
    id: 2,
    category: "Programmable DC Electronic Load",
    specs: [
      {
        id: "el-1",
        spec: "LF2100-A",
        listPrice: 999000,
        details: [
          "DC Input : 1~150V / 0~300A 1Channel",
          "Display Resolution : 5 Digit",
          "AC Input : 220V / 60Hz",
          "RS-232C 통신 기본장착",
        ],
      },
      {
        id: "el-2",
        spec: "LF2200-B",
        listPrice: 1500000,
        details: [
          "DC Input : 1~200V / 0~500A 1Channel",
          "Display Resolution : 5 Digit",
          "AC Input : 220V / 60Hz",
          "RS-232C, Ethernet 통신 기본장착",
        ],
      },
    ],
  },
  {
    id: 3,
    category: "OPTION (EX)",
    specs: [
      {
        id: "op-1",
        spec: "Analog Module(0~10V)",
        listPrice: 150000,
        details: [
          "Analog IN/OUT 0~10V",
          "전압/전류 제어 및 모니터링",
          "Analog ON/OFF",
        ],
      },
      {
        id: "op-2",
        spec: "RS-485 Module",
        listPrice: 100000,
        details: [
          "RS-485 통신 추가 모듈",
          "최대 32대 멀티드롭",
        ],
      },
      {
        id: "op-3",
        spec: "TCP/IP Module",
        listPrice: 200000,
        details: [
          "TCP/IP Ethernet 통신 모듈",
          "원격 제어 및 모니터링 지원",
        ],
      },
    ],
  },
];

// ──────────────────────────────────────────
// 거래 조건 기본값
// ──────────────────────────────────────────
export const DEFAULT_TERMS = {
  delivery: "발주 후 4주",
  validity: "견적일로부터 3개월",
  payment: "현금결제",
};

// ──────────────────────────────────────────
// 공급자 고정 정보
// ──────────────────────────────────────────
export const SUPPLIER_INFO = {
  name: "㈜오디에이테크놀로지",
  bizNo: "122-86-05459",
};
