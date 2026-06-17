# Changelog

## v1.12+20260617.86e6d5d (2026-06-17)

# API Changelog 1.12 vs. 1.12


## API Changes

### PATCH /pay-ins/checkout/{checkoutId}
-  endpoint added


### GET /pay-ins/checkout/{signedLinkId}
-  endpoint added


### GET /smsa/merchant/{merchantId}
- :warning: added the new path request parameter `merchantId`


### GET /terminal/vendor/{vendorId}
- :warning: added the new path request parameter `vendorId`


### POST /vendors/reference/{vendorReference}/invoices
- :warning: added the new required request property `lineItems/items/description`
- :warning: added the new required request property `lineItems/items/quantity`
- :warning: added the new required request property `lineItems/items/unitPrice`
- :warning: request property `paymentMethods/items/` was restricted to a list of enum values
- :warning: the `lineItems/items/` request property type/format changed from `array`/`` to `object`/``
- :warning: the `paymentMethods/items/` request property type/format changed from `array`/`` to `string`/``
- :warning: the `lineItems/items/` response's property type/format changed from `array`/`` to `object`/`` for status `200`
-  added the new `apm` enum value to the request property `paymentMethods/items/`
-  added the new `bankTransfer` enum value to the request property `paymentMethods/items/`
-  added the new `card` enum value to the request property `paymentMethods/items/`
-  added the new `creditCard` enum value to the request property `paymentMethods/items/`
-  added the new `directDebit` enum value to the request property `paymentMethods/items/`
-  added the new `taxFreeChildcare` enum value to the request property `paymentMethods/items/`
-  added the required property `lineItems/items/description` to the response with the `200` status
-  added the required property `lineItems/items/quantity` to the response with the `200` status
-  added the required property `lineItems/items/unitPrice` to the response with the `200` status


### PATCH /vendors/reference/{vendorReference}/invoices/{invoicesId}
- :warning: added the new required request property `lineItems/items/description`
- :warning: added the new required request property `lineItems/items/quantity`
- :warning: added the new required request property `lineItems/items/unitPrice`
- :warning: request property `paymentMethods/items/` was restricted to a list of enum values
- :warning: the `lineItems/items/` request property type/format changed from `array`/`` to `object`/``
- :warning: the `paymentMethods/items/` request property type/format changed from `array`/`` to `string`/``
- :warning: the `lineItems/items/` response's property type/format changed from `array`/`` to `object`/`` for status `200`
-  added the new `apm` enum value to the request property `paymentMethods/items/`
-  added the new `bankTransfer` enum value to the request property `paymentMethods/items/`
-  added the new `card` enum value to the request property `paymentMethods/items/`
-  added the new `creditCard` enum value to the request property `paymentMethods/items/`
-  added the new `directDebit` enum value to the request property `paymentMethods/items/`
-  added the new `taxFreeChildcare` enum value to the request property `paymentMethods/items/`
-  added the required property `lineItems/items/description` to the response with the `200` status
-  added the required property `lineItems/items/quantity` to the response with the `200` status
-  added the required property `lineItems/items/unitPrice` to the response with the `200` status


### GET /vendors/{vendorId}/invoices
- :warning: the `items/items/` response's property type/format changed from `array`/`` to `object`/`` for status `200`
-  added the optional property `items/items/subscriptionId` to the response with the `200` status
-  added the required property `items/items/consumer` to the response with the `200` status
-  added the required property `items/items/createdAt` to the response with the `200` status
-  added the required property `items/items/currency` to the response with the `200` status
-  added the required property `items/items/dueDate` to the response with the `200` status
-  added the required property `items/items/external` to the response with the `200` status
-  added the required property `items/items/id` to the response with the `200` status
-  added the required property `items/items/invoiceObject` to the response with the `200` status
-  added the required property `items/items/isRecurring` to the response with the `200` status
-  added the required property `items/items/lineItems` to the response with the `200` status
-  added the required property `items/items/merchantId` to the response with the `200` status
-  added the required property `items/items/paymentStatus` to the response with the `200` status
-  added the required property `items/items/publicUrl` to the response with the `200` status
-  added the required property `items/items/reference` to the response with the `200` status
-  added the required property `items/items/totalAmount` to the response with the `200` status
-  added the required property `items/items/totalPaid` to the response with the `200` status
-  added the required property `items/items/updatedAt` to the response with the `200` status
-  added the required property `items/items/vatAmount` to the response with the `200` status
-  added the required property `items/items/vendorId` to the response with the `200` status


### POST /vendors/{vendorId}/invoices
- :warning: added the new required request property `lineItems/items/description`
- :warning: added the new required request property `lineItems/items/quantity`
- :warning: added the new required request property `lineItems/items/unitPrice`
- :warning: request property `paymentMethods/items/` was restricted to a list of enum values
- :warning: the `lineItems/items/` request property type/format changed from `array`/`` to `object`/``
- :warning: the `paymentMethods/items/` request property type/format changed from `array`/`` to `string`/``
- :warning: the `lineItems/items/` response's property type/format changed from `array`/`` to `object`/`` for status `200`
-  added the new `apm` enum value to the request property `paymentMethods/items/`
-  added the new `bankTransfer` enum value to the request property `paymentMethods/items/`
-  added the new `card` enum value to the request property `paymentMethods/items/`
-  added the new `creditCard` enum value to the request property `paymentMethods/items/`
-  added the new `directDebit` enum value to the request property `paymentMethods/items/`
-  added the new `taxFreeChildcare` enum value to the request property `paymentMethods/items/`
-  added the required property `lineItems/items/description` to the response with the `200` status
-  added the required property `lineItems/items/quantity` to the response with the `200` status
-  added the required property `lineItems/items/unitPrice` to the response with the `200` status


### GET /vendors/{vendorId}/invoices/{invoicesId}
- :warning: the `lineItems/items/` response's property type/format changed from `array`/`` to `object`/`` for status `200`
-  added the required property `lineItems/items/description` to the response with the `200` status
-  added the required property `lineItems/items/quantity` to the response with the `200` status
-  added the required property `lineItems/items/unitPrice` to the response with the `200` status


### PATCH /vendors/{vendorId}/invoices/{invoicesId}
- :warning: added the new required request property `lineItems/items/description`
- :warning: added the new required request property `lineItems/items/quantity`
- :warning: added the new required request property `lineItems/items/unitPrice`
- :warning: request property `paymentMethods/items/` was restricted to a list of enum values
- :warning: the `lineItems/items/` request property type/format changed from `array`/`` to `object`/``
- :warning: the `paymentMethods/items/` request property type/format changed from `array`/`` to `string`/``
- :warning: the `lineItems/items/` response's property type/format changed from `array`/`` to `object`/`` for status `200`
-  added the new `apm` enum value to the request property `paymentMethods/items/`
-  added the new `bankTransfer` enum value to the request property `paymentMethods/items/`
-  added the new `card` enum value to the request property `paymentMethods/items/`
-  added the new `creditCard` enum value to the request property `paymentMethods/items/`
-  added the new `directDebit` enum value to the request property `paymentMethods/items/`
-  added the new `taxFreeChildcare` enum value to the request property `paymentMethods/items/`
-  added the required property `lineItems/items/description` to the response with the `200` status
-  added the required property `lineItems/items/quantity` to the response with the `200` status
-  added the required property `lineItems/items/unitPrice` to the response with the `200` status


### GET /vendors/{vendorId}/open-banking/details
- :warning: added the new path request parameter `vendorId`

