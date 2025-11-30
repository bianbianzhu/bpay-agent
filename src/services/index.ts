// Export mock services by default
// In production, swap these with real implementations
export { userService } from './mock/user.service.js';
export { billerService } from './mock/biller.service.js';
export { paymentService } from './mock/payment.service.js';
export { contactService } from './mock/contact.service.js';

// Re-export interfaces for dependency injection
export type { IUserService } from './interfaces/user.interface.js';
export type { IBillerService, GetBillersFilter } from './interfaces/biller.interface.js';
export type { IPaymentService } from './interfaces/payment.interface.js';
export type { IContactService } from './interfaces/contact.interface.js';
