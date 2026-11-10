import type { ShareRecord } from '../types.ts';
import { calculateShareRecord } from '../utils/calculations.ts';

const defaultPaid = (date: string) => ({
  status: 'paid' as const,
  date,
  amount: 2800,
  paymentMethod: 'Bank Deposit',
});

const defaultDue = () => ({
  status: 'due' as const,
  amount: 2800,
});

const defaultUpcoming = () => ({
  status: 'upcoming' as const,
  amount: 2800,
});

const rawShares: Omit<ShareRecord, 'totalDeposit' | 'dueMonths' | 'dueAmount' | 'lateFee' | 'totalDue' | 'lateFeePaid'>[] = [
  // 01: Md Fuad Bin Rahman (3 shares)
  {
    id: 'PAS-01',
    sl: '01',
    memberName: 'Md Fuad Bin Rahman',
    phone: '+880 1711-234561',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },
  {
    id: 'PAS-02',
    sl: '',
    memberName: 'Md Fuad Bin Rahman',
    phone: '+880 1711-234561',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },
  {
    id: 'PAS-03',
    sl: '',
    memberName: 'Md Fuad Bin Rahman',
    phone: '+880 1711-234561',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 02: Md Asaduzzaman Nahid (3 shares)
  {
    id: 'PAS-04',
    sl: '02',
    memberName: 'Md Asaduzzaman Nahid',
    phone: '+880 1712-345672',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },
  {
    id: 'PAS-05',
    sl: '',
    memberName: 'Md Asaduzzaman Nahid',
    phone: '+880 1712-345672',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },
  {
    id: 'PAS-06',
    sl: '',
    memberName: 'Md Asaduzzaman Nahid',
    phone: '+880 1712-345672',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 03: Md Farthous Ahmed (3 shares)
  {
    id: 'PAS-07',
    sl: '03',
    memberName: 'Md Farthous Ahmed',
    phone: '+880 1713-456783',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },
  {
    id: 'PAS-08',
    sl: '',
    memberName: 'Md Farthous Ahmed',
    phone: '+880 1713-456783',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },
  {
    id: 'PAS-09',
    sl: '',
    memberName: 'Md Farthous Ahmed',
    phone: '+880 1713-456783',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 04: Md Rafiqul Islam
  {
    id: 'PAS-10',
    sl: '04',
    memberName: 'Md Rafiqul Islam',
    phone: '+880 1714-567894',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 05: Ariful Islam
  {
    id: 'PAS-11',
    sl: '05',
    memberName: 'Ariful Islam',
    phone: '+880 1715-678905',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 06: Md Razi Hassan Bhuiyan
  {
    id: 'PAS-14',
    sl: '06',
    memberName: 'Md Razi Hassan Bhuiyan',
    phone: '+880 1716-789016',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // Md Ranzu Mia (No SL in sheet)
  {
    id: 'PAS-15',
    sl: '',
    memberName: 'Md Ranzu Mia',
    phone: '+880 1717-890127',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('05.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 07: Md Rabby Sharder (2 shares: PAS-16, PAS-17)
  {
    id: 'PAS-16',
    sl: '07',
    memberName: 'Md Rabby Sharder',
    phone: '+880 1718-901238',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },
  {
    id: 'PAS-17',
    sl: '',
    memberName: 'Md Rabby Sharder',
    phone: '+880 1718-901238',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 09: Quazi Mustafizul Haque
  {
    id: 'PAS-18',
    sl: '09',
    memberName: 'Quazi Mustafizul Haque',
    phone: '+880 1720-123450',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 10: Md Mohaiminul Islam (2 shares: PAS-19, PAS-20 - both Due for Sep & Oct)
  {
    id: 'PAS-19',
    sl: '10',
    memberName: 'Md Mohaiminul Islam',
    phone: '+880 1721-234561',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultDue(),
      'Oct-26': defaultDue(),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },
  {
    id: 'PAS-20',
    sl: '',
    memberName: 'Md Mohaiminul Islam',
    phone: '+880 1721-234561',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultDue(),
      'Oct-26': defaultDue(),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 11: Adnan Taher
  {
    id: 'PAS-21',
    sl: '11',
    memberName: 'Adnan Taher',
    phone: '+880 1722-345672',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('11.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 12: Forhad Ahamed Bappy
  {
    id: 'PAS-22',
    sl: '12',
    memberName: 'Forhad Ahamed Bappy',
    phone: '+880 1723-456783',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 13: Shahedul Hossen
  {
    id: 'PAS-23',
    sl: '13',
    memberName: 'Shahedul Hossen',
    phone: '+880 1724-567894',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('11.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 14: Md Hafizul Islam
  {
    id: 'PAS-24',
    sl: '14',
    memberName: 'Md Hafizul Islam',
    phone: '+880 1725-678905',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('11.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 15: Mahabub Rahaman Parvez (2 shares: PAS-25, PAS-26)
  {
    id: 'PAS-25',
    sl: '15',
    memberName: 'Mahabub Rahaman Parvez',
    phone: '+880 1726-789016',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('25.07.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },
  {
    id: 'PAS-26',
    sl: '',
    memberName: 'Mahabub Rahaman Parvez',
    phone: '+880 1726-789016',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('25.07.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 16: Md. Borhan Uddin
  {
    id: 'PAS-27',
    sl: '16',
    memberName: 'Md. Borhan Uddin',
    phone: '+880 1727-890127',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 17: Md. Rony Haulader (PAS-28 - Due for Sep & Oct)
  {
    id: 'PAS-28',
    sl: '17',
    memberName: 'Md. Rony Haulader',
    phone: '+880 1728-901238',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultDue(),
      'Oct-26': defaultDue(),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 18: Babul Hosen
  {
    id: 'PAS-29',
    sl: '18',
    memberName: 'Babul Hosen',
    phone: '+880 1729-012349',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('05.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 19: Md Jahidul Islam Hridoy
  {
    id: 'PAS-30',
    sl: '19',
    memberName: 'Md Jahidul Islam Hridoy',
    phone: '+880 1730-123450',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('05.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 20: Mahmudul Hasan
  {
    id: 'PAS-31',
    sl: '20',
    memberName: 'Mahmudul Hasan',
    phone: '+880 1731-234561',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // 21: Habibullah Sawdagor
  {
    id: 'PAS-32',
    sl: '21',
    memberName: 'Habibullah Sawdagor',
    phone: '+880 1732-345672',
    admissionFee: 5000,
    months: {
      'Aug-26': defaultPaid('15.08.26'),
      'Sep-26': defaultPaid('15.09.26'),
      'Oct-26': defaultPaid('15.10.26'),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },

  // Closed Id: PAS-12,13
  {
    id: 'PAS-12,13',
    sl: '',
    memberName: 'Closed Id',
    phone: '',
    admissionFee: 10000,
    isClosed: true,
    months: {
      'Aug-26': defaultUpcoming(),
      'Sep-26': defaultUpcoming(),
      'Oct-26': defaultUpcoming(),
      'Nov-26': defaultUpcoming(),
      'Dec-26': defaultUpcoming(),
    },
  },
];

export const INITIAL_SHARES: ShareRecord[] = rawShares.map(s =>
  calculateShareRecord({
    ...s,
    totalDeposit: 0,
    dueMonths: 0,
    dueAmount: 0,
    lateFee: 0,
    totalDue: 0,
    lateFeePaid: 0,
  })
);
