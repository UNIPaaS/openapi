# Changelog

## v1.12+20261019.d653a5c (2026-10-19)

# API Changelog 1.12 vs. 1.12


## API Changes

### POST /pay-ins/checkout
-  added the new optional request property `childcarePayments`
-  added the optional property `childcarePayments` to the response with the `201` status


### PATCH /pay-ins/checkout/{signedLinkId}
-  added the new optional request property `childcarePayments`
-  added the optional property `childcarePayments` to the response with the `201` status


### POST /pay-ins/checkout/{signedLinkId}/expire
-  added the optional property `childcarePayments` to the response with the `201` status


### POST /pay-ins/{authorizationId}/reschedule
-  added the new optional request property `childcarePayments`
-  added the optional property `childcarePayments` to the response with the `201` status


### GET /vendors
- :warning: added the new `ANTIQUE_SHOPS_SALES_OF_USED_GOODS_ANTIQUES_AND_COLLECTIBLES` enum value to the `items/category` response property for the response status `202`


### POST /vendors
- :warning: added the new `ANTIQUE_SHOPS_SALES_OF_USED_GOODS_ANTIQUES_AND_COLLECTIBLES` enum value to the `category` response property for the response status `201`
-  added the new `ANTIQUE_SHOPS_SALES_OF_USED_GOODS_ANTIQUES_AND_COLLECTIBLES` enum value to the request property `category`


### GET /vendors/{vendorId}
- :warning: added the new `ANTIQUE_SHOPS_SALES_OF_USED_GOODS_ANTIQUES_AND_COLLECTIBLES` enum value to the `category` response property for the response status `202`


### GET /vendors/{vendorId}/embedded/payouts
-  added the new enum value `Init` to the `query` request parameter `transactionType`


### POST /vendors/{vendorId}/mandates
-  added the new optional request property `rail`


### GET /vendors/{vendorId}/payments
-  added the new enum value `Init` to the `query` request parameter `transactionType`


### GET /vendors/{vendorId}/payouts/{payoutId}/transactions
-  added the new enum value `Init` to the `query` request parameter `transactionType`

## v1.12+20261005.facaa66 (2026-10-05)

# API Changelog 1.12 vs. 1.12


## API Changes

### GET /vendors/{vendorId}/embedded/payouts
-  added the new optional `query` request parameter `timezone`


### GET /vendors/{vendorId}/payments
-  added the new optional `query` request parameter `timezone`


### GET /vendors/{vendorId}/payouts/{payoutId}/transactions
-  added the new optional `query` request parameter `timezone`

## v1.12+20260617.86e6d5d (2026-06-17)

Initial published spec.

