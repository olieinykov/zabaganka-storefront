# Nova Poshta / Ukrposhta delivery integration

## Что сделано

### Backend (Medusa.js v2.18)

1. **Fulfillment providers** — `src/modules/nova-poshta-fulfillment` и
   `src/modules/ukrposhta-fulfillment`. Каждый — полноценный Fulfillment
   Module Provider (`AbstractFulfillmentProviderService`), со своими
   fulfillment-опциями:
   - Nova Poshta: `Відділення`, `Поштомат`, `Кур'єр`
   - Ukrposhta: `Відділення`, `Кур'єр`

   В `validateFulfillmentData` проверяется, что для типов
   `warehouse`/`postomat` передан `city_ref` + `warehouse_ref`, а для
   `courier` — что у корзины уже есть полный адрес доставки.
   `calculatePrice` считает реальную стоимость через Nova Poshta API
   (`InternetDocument.getDocumentPrice`); для Ukrposhta — заглушка (см. ниже).

   Провайдеры регистрируются в `medusa-config.ts` (`modules` →
   `@medusajs/medusa/fulfillment` → `providers`).

2. **API-эндпоинты, скрывающие API-ключи** — `src/api/store/delivery/*`:
   - `GET /store/delivery/nova-poshta/cities?q=...`
   - `GET /store/delivery/nova-poshta/warehouses?cityRef=...&q=...&type=warehouse|postomat`
   - `GET /store/delivery/ukrposhta/cities?q=...`
   - `GET /store/delivery/ukrposhta/warehouses?cityRef=...&q=...`

   Роуты используют тот же HTTP-клиент (`client.ts`), что и fulfillment-провайдер,
   так что ключ Nova Poshta/Ukrposhta ни при каких условиях не попадает в браузер.

3. **Запись в `metadata`**:
   - Стор-сторона (`sdk.store.cart.update`) пишет выбор в `cart.metadata.delivery`.
   - При завершении оформления заказа Medusa **уже сама** копирует
     `cart.metadata` → `order.metadata` (это часть `completeCartWorkflow` из
     `@medusajs/medusa/core-flows`, начиная с текущей версии 2.18 — в более
     старых версиях 2.x это был известный баг, см. issue `medusajs/medusa#10629`,
     он исправлен).
   - Дополнительно добавлен подписчик `src/subscribers/order-delivery-metadata.ts`
     на событие `order.placed` — он идемпотентно досинхронизирует
     `order.metadata` из `cart.metadata`, если по какой-то причине основной
     механизм это не сделал. Это защитный, а не основной механизм.
   - Сам выбор города/отделения также сохраняется в `data` shipping method'а
     (через `validateFulfillmentData`), то есть попадает и в `Fulfillment`
     при его создании администратором.

### Frontend (Next.js Storefront)

1. `src/lib/data/delivery.ts` — server actions, которые обращаются к новым
   backend-роутам (`/store/delivery/...`).
2. `src/lib/data/cart.ts` — добавлена `setCartDeliveryMetadata` (пишет
   `cart.metadata.delivery`) и `setShippingMethod` теперь принимает
   необязательный `data`.
3. `src/modules/checkout/components/delivery-destination/index.tsx` — новый
   компонент с автокомплитом города и отделения/поштомата (debounce 300–350мс),
   либо полем комментария для курьера.
4. `src/modules/checkout/components/shipping/index.tsx` — при выборе
   способа доставки от Nova Poshta/Ukrposhta показывается
   `DeliveryDestination`; сохранение shipping method откладывается до тех
   пор, пока не выбраны город + отделение (для курьера — сразу, комментарий
   необязателен).

## ⚠️ ВАЖНО: где использованы плейсхолдеры

**Nova Poshta** — использован **настоящий, публичный и документированный**
API (`https://api.novaposhta.ua/v2.0/json/`, методы `Address.getCities`,
`AddressGeneral.getWarehouses`, `InternetDocument.getDocumentPrice`). Единственное,
что нужно — реальный `NOVA_POSHTA_API_KEY` и `NOVA_POSHTA_SENDER_CITY_REF`
(Ref города/склада, откуда идёт отправка — нужен для расчёта стоимости).

**Ukrposhta** — их каталог городов/отделений и тарифный калькулятор **не
имеют открытого self-service API**: доступ выдаётся только после подписания
договора (данные — `dev.ukrposhta.ua`, `Authorization: Bearer <token>`,
токен выдаёт менеджер). Поэтому:

- `src/modules/ukrposhta-fulfillment/client.ts` — **плейсхолдер**. Пока
  `UKRPOSHTA_API_BASE_URL`/`UKRPOSHTA_BEARER_TOKEN` не заданы, он отдаёт
  небольшой статический список городов/отделений (чтобы чекаут можно было
  полностью протестировать end-to-end), а расчёт цены — простую формулу
  `60 + 15×вес(кг)` грн.
- Как только у вас будет подписан договор с Укрпоштой и получены реальные
  креды — заполните переменные окружения и замените заглушечную логику в
  `client.ts` на реальные `fetch`-запросы по документации из вашего кабинета
  (пути/тела запросов в файле помечены комментариями `PLACEHOLDER`).

## Переменные окружения (`.env`)

```
NOVA_POSHTA_API_KEY=
NOVA_POSHTA_SENDER_CITY_REF=

UKRPOSHTA_API_BASE_URL=
UKRPOSHTA_BEARER_TOKEN=
UKRPOSHTA_USER_TOKEN=
UKRPOSHTA_SENDER_CITY_REF=
```

## Что нужно сделать вам после установки

1. Указать `NOVA_POSHTA_API_KEY` (получить в кабинете https://new.novaposhta.ua)
   и `NOVA_POSHTA_SENDER_CITY_REF`.
2. В админке Medusa (Settings → Locations & Shipping) добавить fulfillment-
   провайдеры `nova-poshta` и `ukrposhta` локации и создать shipping-опции
   для каждой из fulfillment-опций (`Відділення`/`Поштомат`/`Кур'єр`).
3. (Опционально) подписать договор с Укрпоштою и подключить реальный API.
