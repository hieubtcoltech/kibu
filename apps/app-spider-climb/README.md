# Spider Climb — bản ứng dụng di động cho App Store

Vỏ ứng dụng (Capacitor) bọc quanh game Spider Climb ở [`../spider-climb`](../spider-climb/).
Toàn bộ game nằm trong gói cài đặt: **không cần mạng, không gọi máy chủ nào.**

Bản app **không chép tay** mã nguồn game. Mỗi lần sửa game trên web, chạy
`npm run sync` là bản app cập nhật theo — web và app không bao giờ lệch nhau.

---

## Chạy thử

```bash
cd app-spider-climb
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
> `spider-climb/index.html` đổi tới mức một phép không còn khớp, script **dừng
> ngay** và báo tên phép đó.

## Đổi icon

Icon app lấy từ `../spider-climb/icon-800.jpg`. Thay tệp đó rồi:

```bash
npm run icons
```

---

## Bản app khác bản web chỗ nào

Bốn khác biệt, đều để qua được vòng duyệt của Apple:

| | Web | App | Vì sao |
|---|---|---|---|
| Phông chữ, bộ icon, lá cờ | tải từ CDN | nằm trong gói | Apple duyệt app trong phòng kín, mạng chập chờn. Mất mạng mà app trắng màn là trượt. |
| Google Analytics, bộ đếm người online | có | **bỏ** | App cho trẻ em không được gửi dữ liệu đi khi chưa có người lớn đồng ý. |
| Facebook / Telegram / WhatsApp, nút "Trang chủ" | có | **bỏ** | App cho trẻ mà bắn ra trình duyệt ngoài là lý do bị từ chối phổ biến. |
| Chia sẻ điểm | cửa sổ bật lên của trình duyệt | khay chia sẻ của iOS | Giao diện hệ thống, không rời khỏi app. |

Ngoài ra:
- Chừa lề tai thỏ và thanh vuốt bằng `viewport-fit=cover` và safe-area insets (`100dvh`).
- Cấm phóng to bằng hai ngón và cử chỉ cuộn trang nảy.
- Dời nút đổi ngôn ngữ từ chân trang lên thanh nút trên cùng.
- Tối ưu hóa vị trí 2 nút cảm ứng `#btn-boost` và `#btn-web` trên màn hình điện thoại.

---

## Dựng tệp .ipa để nộp

```bash
npm run ipa
```

Ra `build/ipa/App.ipa`.

| | |
|---|---|
| Bundle ID | `com.kibu.SpiderClimb` |
| Team | `S8S7RJA9P9` — Roxwin Vietnam Technologies Company Limited |
| Ký | Automatic |

---

## Cấu trúc thư mục

```
app-spider-climb/
├── build-www.js          dựng www/ từ ../spider-climb
├── fetch-vendor.js       tải/đồng bộ phông chữ + icon + cờ về vendor/
├── make-icons.js         icon 1024 + màn hình chờ, từ icon của game
├── make-ipa.js           archive + ký + xuất .ipa để nộp store
├── ExportOptions.plist   cấu hình xuất: nộp App Store, ký tự động
├── capacitor.config.json tên app, bundle id, màu nền
├── src/
│   ├── app.css           lề tai thỏ, nút bấm cảm ứng, chống kéo trang, nút cờ trên nav
│   └── app.js            khay chia sẻ iOS, tắt màn hình chờ, chặn gesture
├── vendor/               phông chữ + Font Awesome + lá cờ (có trong git)
├── www/                  KẾT QUẢ DỰNG — không sửa tay
└── ios/                  dự án Xcode
```
