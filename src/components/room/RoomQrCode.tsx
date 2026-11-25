"use client";
// =============================================================================
// RoomQrCode — a QR code for the room's link. Friends point their phone
// camera at it and land straight in this room (then pick a nickname).
//
// The code is always black on a white square, even in dark mode: phone
// cameras read dark-on-light codes most reliably.
//
// "localhost" only works on the computer itself, so on a dev machine we also
// explain how to make the room reachable from phones on the same Wi-Fi.
// =============================================================================

import { QRCodeSVG } from "qrcode.react";

/** Hostnames that only mean "this computer", so a phone can't open them. */
const LOCAL_ONLY = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function RoomQrCode({ code }: { code: string }) {
  // This component only ever renders in the browser (inside the lobby).
  const { origin, hostname } = window.location;
  const url = `${origin}/room/${code}`;

  return (
    <figure className="flex flex-col items-center gap-2">
      <div className="rounded-xl bg-white p-3">
        <QRCodeSVG value={url} size={152} level="M" title={`QR code to join room ${code}`} />
      </div>
      <figcaption className="text-sm text-zinc-500">Scan with a phone camera to join</figcaption>
      {LOCAL_ONLY.has(hostname) && (
        <p className="max-w-xs text-xs text-amber-700 dark:text-amber-400">
          Phones can&apos;t open &ldquo;{hostname}&rdquo;. Run <code>npm run dev:lan</code> and{" "}
          <code>npm run party:dev:lan</code>, then open this page using your computer&apos;s network address (e.g.{" "}
          <code>http://192.168.1.20:3000</code>).
        </p>
      )}
    </figure>
  );
}
