export type ContactType = 'BUSINESS' | 'PERSON';

export interface BankAccountDetails {
  __typename: 'BankAccountDetails';
  bsb: string;
  account: string;
  name: string;
}

export interface BpayStaticCrnDetails {
  __typename: 'PaymentInstrumentBpayStaticCrnDetails';
  billerName: string;
  billerCode: string;
  crn: string;
}

export type PaymentInstrumentDetails = BankAccountDetails | BpayStaticCrnDetails;

export interface PaymentInstrument {
  id: string;
  details: PaymentInstrumentDetails;
}

export interface Contact {
  id: string;
  name: string;
  contactType: ContactType;
  paymentInstruments: PaymentInstrument[];
}
