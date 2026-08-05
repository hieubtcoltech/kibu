# Balloon Darts — bản ứng dụng cho App Store

Vỏ ứng dụng (Capacitor) bọc quanh game phi tiêu ở [`../darts-game`](../darts-game/).
Toàn bộ game nằm trong gói cài đặt: **không cần mạng, không gọi máy chủ nào.**

Bản app **không chép tay** mã nguồn game. Mỗi lần sửa game trên web, chạy
`npm run sync` là bản app cập nhật theo — web và app không bao giờ lệch nhau.

---

## Chạy thử

```bash
cd app-darts
npm install          # lần đầu
npm run ios          # dựng www/ + đồng bộ + mở Xcode
```

Trong Xcode: chọn máy giả lập (hoặc iPhone thật cắm dây) rồi bấm ▶.

Muốn dựng nhanh không mở Xcode:

```bash
npm run build        # chỉ dựng lại www/
npm run sync         # dựng + chép sang dự án iOS
```

## Cập nhật khi game trên web đổi

```bash
npm run sync
```

Rồi bấm ▶ lại trong Xcode. Không cần đụng vào thư mục `ios/`.

> `build-www.js` bắt buộc mọi phép sửa HTML phải khớp. Nếu sau này
> `darts-game/index.html` đổi tới mức một phép không còn khớp, script **dừng
> ngay** và báo tên phép đó. Thà hỏng lúc dựng còn hơn ra một bản app thiếu mất
> phần đã sửa — mở `build-www.js` sửa đúng phép được báo rồi dựng lại.

## Đổi icon

Icon app lấy từ `../darts-game/icon-800.jpg`. Thay tệp đó rồi:

```bash
npm run icons
```

## Thêm Android sau này

```bash
npm i @capacitor/android && npx cap add android && npm run sync
```

Mọi thứ trong `www/` dùng lại nguyên vẹn.

---

## Bản app khác bản web chỗ nào

Bốn khác biệt, đều để qua được vòng duyệt của Apple. Chi tiết ghi trong
[`build-www.js`](build-www.js).

| | Web | App | Vì sao |
|---|---|---|---|
| Phông chữ, bộ icon, lá cờ | tải từ CDN | nằm trong gói | Apple duyệt app trong phòng kín, mạng chập chờn. Mất mạng mà app trắng màn là trượt. |
| Google Analytics, bộ đếm người online | có | **bỏ** | App cho trẻ em không được gửi dữ liệu đi khi chưa có người lớn đồng ý. Không có gì để gửi là gọn nhất. |
| Facebook / Telegram / WhatsApp, nút "Trang chủ", chia sẻ lên Facebook & X | có | **bỏ** | App cho trẻ mà bắn ra trình duyệt ngoài là lý do bị từ chối phổ biến. |
| Chia sẻ điểm | cửa sổ bật lên của trình duyệt | khay chia sẻ của iOS | Giao diện hệ thống, không rời khỏi app. |

Ngoài ra: chừa lề tai thỏ và thanh vuốt, giấu thanh trạng thái, cấm phóng to
bằng hai ngón, và dời nút đổi ngôn ngữ từ chân trang lên thanh nút trên cùng
(xoay ngang iPhone chỉ còn hơn 400 điểm ảnh chiều cao, không đủ chỗ cho chân
trang).

Game vẫn chạy được cả tiếng Việt lẫn tiếng Anh — `i18n.js` đi kèm trong gói,
mặc định theo ngôn ngữ máy, bấm lá cờ để đổi.

---

## Dựng tệp .ipa để nộp

```bash
npm run ipa
```

Ra `build/ipa/App.ipa`. Lệnh này tự dựng lại `www/`, archive bản Release và ký
bằng chứng chỉ **Apple Distribution** (Xcode tự xin chứng chỉ và hồ sơ cấp phép
nhờ `-allowProvisioningUpdates`).

Đã cấu hình sẵn, theo đúng lối của dự án CardyCat:

| | |
|---|---|
| Bundle ID | `com.kibu.BalloonDarts` |
| Team | `S8S7RJA9P9` — Roxwin Vietnam Technologies Company Limited |
| Ký | Automatic |

Đổi bundle id thì sửa `appId` trong [`capacitor.config.json`](capacitor.config.json)
**và** `PRODUCT_BUNDLE_IDENTIFIER` trong `ios/App/App.xcodeproj` cho khớp nhau.

Kiểm lại tệp .ipa trước khi nộp:

```bash
unzip -q build/ipa/App.ipa -d /tmp/ipa && codesign -dvvv /tmp/ipa/Payload/App.app
# phải thấy: Authority=Apple Distribution: …
```

**Nộp bản mới** thì tăng `CURRENT_PROJECT_VERSION` (Build) trong Xcode → target
App → General. App Store Connect từ chối thẳng bản trùng số dựng.

---

## Còn lại phải làm bằng tay (cần tài khoản Apple của anh)

### 1. Tạo app trong App Store Connect

<https://appstoreconnect.apple.com> → **My Apps** → **+** → New App

| Mục | Điền |
|---|---|
| Tên | Balloon Darts (tên phải chưa ai lấy) |
| Ngôn ngữ chính | English (thêm Vietnamese ở phần Localizations) |
| Bundle ID | com.kibu.BalloonDarts |
| SKU | balloon-darts |
| Danh mục | Games → Casual (danh mục phụ: Family) |
| Xếp hạng độ tuổi | 4+ |

### 2. Ảnh chụp màn hình (bắt buộc)

App chạy cả iPhone lẫn iPad nên phải nộp **cả hai bộ**:

- iPhone 6.9" — 1320 × 2868 (hoặc 1290 × 2796)
- iPad 13" — 2064 × 2752

Hai lệnh, chạy theo thứ tự:

```bash
npm run shots          # chụp ảnh THÔ trên máy giả lập → screenshots/<cỡ máy>/
npm run store-shots    # bọc thành ảnh QUẢNG BÁ     → screenshots/store-en|vi/
```

**`npm run shots`** tự dựng cảnh rồi bấm máy đúng mốc: màn chọn chế độ, 2 bé
thi, 4 bé, sân biển, sân vũ trụ, chơi một mình, săn bóng vàng, bảng kết quả.
Ra ảnh đúng cái màn hình máy, không hơn.

**`npm run store-shots`** biến mỗi ảnh thô thành một tấm quảng bá: nền màu hợp
với cảnh, khung máy vẽ bằng CSS (bo góc, đảo động, gờ kính, bóng đổ), và một
câu nói rõ tính năng. Ra hai bộ Anh–Việt vì App Store Connect cho gắn ảnh riêng
theo ngôn ngữ. Sửa lời trong bảng `WORDS`, đổi màu nền trong bảng `SKINS` ở
`make-store-shots.js`.

> **Nên nộp bộ NẰM NGANG** (`iphone-6.9`, `ipad-13`). Trò này chơi ngang là
> chính; ở bản dựng đứng thì sân chơi co lại thành một dải giữa hai vùng đen,
> đúng như app thật nhưng lên store trông trống trải. Bộ dựng đứng vẫn dựng ra
> đủ, cần thì dùng.

Cả hai lệnh đều cần Google Chrome (bộ ghép ảnh dựng bằng trình duyệt) và máy
giả lập iPhone 16 Pro Max + iPad Pro 13" trong Xcode.

### 3. Quyền riêng tư

- **App Privacy** trong App Store Connect: chọn **"Data Not Collected"** — app
  không thu thập gì thật, điểm cao nhất chỉ nằm trong máy.
- Vẫn **bắt buộc** có một trang chính sách quyền riêng tư công khai để dán URL
  vào. Trang `kibugames.com/about` chưa đủ, cần một trang riêng nói rõ "không
  thu thập dữ liệu". Em viết cho anh trang đó nếu anh muốn.

### 4. Nộp tệp .ipa

Tạo app trong App Store Connect **trước**, rồi mới nộp — không có bản ghi app
thì tệp lên tới nơi bị trả về.

- **Transporter** (tải free trên Mac App Store): kéo `build/ipa/App.ipa` vào,
  bấm Deliver. Cách dễ nhất.
- Hoặc dòng lệnh:
  ```bash
  xcrun altool --upload-app -f build/ipa/App.ipa -t ios \
      -u <apple-id> -p <mật-khẩu-riêng-cho-ứng-dụng>
  ```
  Mật khẩu riêng lấy ở <https://appleid.apple.com> → Sign-In and Security →
  App-Specific Passwords. Đừng dùng mật khẩu Apple ID thật.

Bản dựng lên tới nơi mất 5–15 phút mới hiện trong TestFlight.

---

## Vài điều nên biết trước khi nộp

**Danh mục "Kids"** — App Store có danh mục riêng cho trẻ em. Vào đó thì app
được phụ huynh tin hơn, nhưng luật ngặt hơn: mọi thứ dẫn ra ngoài app đều phải
có cổng kiểm tra người lớn, kể cả khay chia sẻ. Nếu anh chọn danh mục này, thêm
dòng này vào cuối [`src/app.css`](src/app.css) rồi `npm run sync`:

```css
#solo-share { display: none !important; }
```

Còn để ở **Games → Casual** như đang cấu hình thì giữ nguyên là được.

**Lần duyệt đầu** thường 24–48 tiếng. Lý do trượt hay gặp nhất với game dạng
này là "app chỉ là trang web đóng gói lại" (điều 4.2). App của mình chạy trọn
vẹn khi tắt mạng và không có thanh địa chỉ nào, nên không dính — nhưng nếu
người duyệt có hỏi, cứ trả lời đúng như vậy.

**Âm thanh** đi theo nút gạt im lặng của máy, như phần lớn game khác.

---

## Cấu trúc thư mục

```
app-darts/
├── build-www.js          dựng www/ từ ../darts-game — đọc tệp này trước khi sửa gì
├── fetch-vendor.js       tải phông chữ / bộ icon / lá cờ về vendor/ (chạy một lần)
├── make-icons.js         icon 1024 + màn hình chờ, từ icon của game
├── make-ipa.js           archive + ký + xuất .ipa để nộp store
├── ExportOptions.plist   cấu hình xuất: nộp App Store, ký tự động
├── capacitor.config.json tên app, bundle id, màu nền
├── src/
│   ├── app.css           lề tai thỏ, chống kéo trang, nút đổi ngôn ngữ trên nav
│   └── app.js            khay chia sẻ iOS, gỡ nút mạng xã hội, tắt màn hình chờ
├── vendor/               phông chữ + Font Awesome + lá cờ (có trong git)
├── www/                  KẾT QUẢ DỰNG — không sửa tay, không có trong git
└── ios/                  dự án Xcode (có trong git)
```
