# Postex verification notes

Source: https://api.postex.ir (official technical docs fetched 2026-09-05)

- API authentication uses header `x-api-key`.
- All cities: `GET /api/v1/locality/cities/all` (observed live response was 31 province-like records, not destination cities).
- Destination cities: `GET /api/v1/locality/cities/to/all`.
- Provinces: `GET /api/v1/locality/provinces`.
- Shipping quote: `POST /api/v1/shipping/quotes`.
- Quote body documents `collection_type`, `from_city_code`, optional `courier` with `courier_code` and `service_type`, `parcels`, and `value_added_service`.
- Quote parcel properties document dimensions, `total_weight`, flags, `total_value`, `pre_paid_amount`, currency `IRR`, and `box_type_id`.
- Standard boxes endpoint: `GET /api/v1/common/boxes`.
- Live MiniRoyal `/api/shipping/postex/cities` after destination-city fix returned 10 cities, sample: Tehran id 1, Shiraz id 409, Isfahan id 175; provinces array was empty due response field shape.
- Live quote request `{city:'تهران', totalValue:10000, totalWeight:500, paymentType:'SENDER'}` still returned HTTP 502 from MiniRoyal; Hostinger logs show provider HTTP 400 with message `خطا در داده های ورودی`.
- Latest completed Hostinger deployment before metadata change: `01a0728d-bcdb-7383-9703-7b7ee6711b58`, completed 2026-09-05T17:12:18Z.
- Official docs page: https://www.postex.com/en/developers/postex-api/ (generic API page); technical docs used above: https://api.postex.ir

Safety: no API keys or customer data saved here.
