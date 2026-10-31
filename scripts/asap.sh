#!/usr/bin/env bash
# Cek cepat URL produksi: halaman, tes sambungan, mode demo, semua endpoint GET, dan penjaga akses.
# Pakai: bash scripts/asap.sh https://talkly-orcin.vercel.app
# Keluar dengan kode ≠ 0 bila ada yang gagal.

set -u
URL="${1:?Pakai: bash scripts/asap.sh <URL>}"
URL="${URL%/}"
JAR_IBU=$(mktemp); JAR_NADIA=$(mktemp)
trap 'rm -f "$JAR_IBU" "$JAR_NADIA"' EXIT
GAGAL=0

cek() { # cek <label> <harapan> <status> [ms]
  if [ "$3" = "$2" ]; then printf "  ok   %-48s %s %s\n" "$1" "$3" "${4:-}"
  else printf "  GAGAL %-47s %s (harap %s)\n" "$1" "$3" "$2"; GAGAL=1; fi
}

minta() { # minta <jar|-> <metode> <path> [body] → "status ms"
  local jar=$1 metode=$2 path=$3 body=${4:-}
  local args=(-s -o /dev/null -w "%{http_code} %{time_total}" -X "$metode")
  [ "$jar" != "-" ] && args+=(-b "$jar" -c "$jar")
  [ -n "$body" ] && args+=(-H "Content-Type: application/json" -d "$body")
  curl "${args[@]}" "$URL$path" | awk '{printf "%s %dms", $1, $2*1000}'
}

echo "Halaman"
for p in / /hari-ini /rekam /kemajuan /profil /terapis /terapis/masuk; do
  read -r s ms <<<"$(minta - GET "$p")"; cek "GET $p" 200 "$s" "$ms"
done

echo "Tes sambungan"
isi=$(curl -s "$URL/api/tes-sambungan")
echo "  $isi"
echo "$isi" | grep -q '"ok":false' && { echo "  GAGAL ada layanan yang belum ok"; GAGAL=1; }

echo "Mode demo"
read -r s ms <<<"$(minta "$JAR_IBU" POST /api/demo '{"sebagai":"ibu_sari"}')"; cek "demo ibu_sari" 204 "$s" "$ms"
read -r s ms <<<"$(minta "$JAR_NADIA" POST /api/demo '{"sebagai":"kak_nadia"}')"; cek "demo kak_nadia" 204 "$s" "$ms"

echo "Endpoint keluarga (Ibu Sari)"
for p in /api/saya /api/saya/izin /api/hari-ini /api/kemajuan /api/keluarga-minggu-ini /api/pesan; do
  read -r s ms <<<"$(minta "$JAR_IBU" GET "$p")"; cek "GET $p" 200 "$s" "$ms"
done

echo "Endpoint terapis (Kak Nadia)"
for p in /api/minggu-ini /api/aktivitas-bank; do
  read -r s ms <<<"$(minta "$JAR_NADIA" GET "$p")"; cek "GET $p" 200 "$s" "$ms"
done

echo "Penjaga akses"
read -r s _ <<<"$(minta - GET /api/rekaman/00000000-0000-4000-8000-000000000000)"; cek "rekaman tanpa cookie" 401 "$s"
read -r s _ <<<"$(minta "$JAR_NADIA" GET /api/hari-ini)"; cek "terapis membuka hari-ini (K9)" 401 "$s"

[ $GAGAL -eq 0 ] && echo "Semua lolos." || echo "Ada yang gagal."
exit $GAGAL
