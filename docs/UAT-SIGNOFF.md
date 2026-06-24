# UAT and Sign-off Checklist

Use this with the client before final launch approval.

## Test Accounts

- [ ] Super admin account provided
- [ ] Manager account provided
- [ ] Cashier account provided
- [ ] Stock keeper account provided

## 1. Authentication

- [ ] User can log in successfully
- [ ] User can log out successfully
- [ ] Password reset flow works
- [ ] Session remains stable during normal usage

## 2. Dashboard & Navigation

- [ ] Dashboard loads without error
- [ ] Navigation items match the logged-in role
- [ ] Non-super-admin users do not see Settings
- [ ] Restricted pages are blocked correctly

## 3. POS & Sales

- [ ] Products can be added to cart
- [ ] Checkout completes successfully
- [ ] Invoice number is generated
- [ ] Receipt can be printed
- [ ] Receipt can be shared via WhatsApp
- [ ] Credit sale flow works

## 4. Inventory

- [ ] Products can be created
- [ ] Products can be updated
- [ ] Stock quantity changes correctly after sale
- [ ] Low-stock and expiry indicators display correctly

## 5. Customers & Debts

- [ ] Customers can be created and edited
- [ ] Customer purchase history is reflected in totals
- [ ] Debt records are created for credit sales
- [ ] Debt payments can be recorded

## 6. Expenses & Reports

- [ ] Expenses can be recorded
- [ ] Sales report reflects recent transactions
- [ ] Financial report includes expenses and net profit
- [ ] Customer report shows top customers and debtors

## 7. Staff & Security

- [ ] Staff accounts can be created and edited
- [ ] Role permissions behave correctly
- [ ] Activity log records important actions
- [ ] Active sessions can be reviewed and revoked

## 8. Recovery & Admin Controls

- [ ] Deleted records appear in Recycle Bin
- [ ] Records can be restored from Recycle Bin
- [ ] Branch management works as expected
- [ ] Stock transfer works if used at launch

## 9. Offline Test

- [ ] PWA or installed app opens correctly
- [ ] Sale can be created while offline
- [ ] Offline sale is queued
- [ ] Sale syncs correctly when internet returns
- [ ] No duplicate sale is created on sync

## 10. Client Sign-off

- [ ] Client confirms major workflows are acceptable
- [ ] Open issues are listed and agreed
- [ ] Launch approval is granted

### Sign-off Record

- Client name:
- Date:
- Environment tested:
- Approved by:
- Notes / exceptions:

