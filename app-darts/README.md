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

## Còn lại phải làm bằng tay (cần tài khoản Apple của anh)

Phần code đã xong. Mấy bước dưới đây em không làm thay được vì cần tài khoản và
chữ ký của anh.

### 1. Tài khoản

- Đăng ký **Apple Developer Program** — 99 USD/năm, duyệt 1–2 ngày:
  <https://developer.apple.com/programs/>

### 2. Ký ứng dụng (trong Xcode)

Mở `ios/App/App.xcodeproj` → chọn target **App** → tab **Signing & Capabilities**:

- Tích **Automatically manage signing**
- **Team**: chọn team của anh
- **Bundle Identifier**: hiện là `com.kibugames.balloondarts`. Đổi thì sửa
  `appId` trong [`capacitor.config.json`](capacitor.config.json) rồi chạy
  `npm run sync`, đừng sửa trong Xcode (lần sync sau sẽ bị ghi đè).

### 3. Tạo app trong App Store Connect

<https://appstoreconnect.apple.com> → **My Apps** → **+** → New App

| Mục | Điền |
|---|---|
| Tên | Balloon Darts (tên phải chưa ai lấy) |
| Ngôn ngữ chính | English (thêm Vietnamese ở phần Localizations) |
| Bundle ID | com.kibugames.balloondarts |
| SKU | balloon-darts |
| Danh mục | Games → Casual (danh mục phụ: Family) |
| Xếp hạng độ tuổi | 4+ |

### 4. Ảnh chụp màn hình (bắt buộc)

App chạy cả iPhone lẫn iPad nên phải nộp **cả hai bộ**:

- iPhone 6.9" — 1320 × 2868 (hoặc 1290 × 2796)
- iPad 13" — 2064 × 2752

Chụp bằng máy giả lập: chạy app rồi `Cmd + S` trong Simulator, hoặc

```bash
xcrun simctl io booted screenshot anh.png
```

Nên chụp 3–5 ảnh: màn chọn chế độ, lúc 2 bé đang thi, màn kết quả, sân biển.
Anh bảo em một tiếng là em chụp trọn bộ cho.

### 5. Quyền riêng tư

- **App Privacy** trong App Store Connect: chọn **"Data Not Collected"** — app
  không thu thập gì thật, điểm cao nhất chỉ nằm trong máy.
- Vẫn **bắt buộc** có một trang chính sách quyền riêng tư công khai để dán URL
  vào. Trang `kibugames.com/about` chưa đủ, cần một trang riêng nói rõ "không
  thu thập dữ liệu". Em viết cho anh trang đó nếu anh muốn.

### 6. Nộp

Trong Xcode: **Product → Destination → Any iOS Device**, rồi **Product →
Archive** → **Distribute App** → **App Store Connect** → **Upload**.

Nộp bản mới thì tăng số ở Xcode → target App → tab General:
`Version` (1.0 → 1.1) và `Build` (1 → 2). Build phải luôn tăng.

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
├── capacitor.config.json tên app, bundle id, màu nền
├── src/
│   ├── app.css           lề tai thỏ, chống kéo trang, nút đổi ngôn ngữ trên nav
│   └── app.js            khay chia sẻ iOS, gỡ nút mạng xã hội, tắt màn hình chờ
├── vendor/               phông chữ + Font Awesome + lá cờ (có trong git)
├── www/                  KẾT QUẢ DỰNG — không sửa tay, không có trong git
└── ios/                  dự án Xcode (có trong git)
```
