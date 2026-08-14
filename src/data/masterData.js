export const INITIAL_STAFF = [];

export const INITIAL_CUSTOMERS = [];

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

export const DEFAULT_TERMS = {
  delivery: "발주 후 4주",
  validity: "견적일로부터 3개월",
  payment: "현금결제",
};

export const SUPPLIER_INFO = {
  name: "㈜오디에이테크놀로지",
  bizNo: "122-86-05459",
};
