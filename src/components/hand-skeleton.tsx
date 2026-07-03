/*
 * Visual signature: skeleton 21 titik landmark tangan, topologi yang sama
 * dengan keluaran MediaPipe Hand Landmarker yang dipakai SAPA di browser.
 */

const landmarks: Array<[number, number]> = [
  [150, 270], // 0 wrist
  [113, 243], // 1 thumb cmc
  [88, 213], // 2 thumb mcp
  [72, 185], // 3 thumb ip
  [60, 160], // 4 thumb tip
  [118, 172], // 5 index mcp
  [108, 130], // 6
  [102, 103], // 7
  [97, 78], // 8 index tip
  [145, 165], // 9 middle mcp
  [143, 117], // 10
  [142, 87], // 11
  [141, 58], // 12 middle tip
  [172, 170], // 13 ring mcp
  [176, 125], // 14
  [179, 97], // 15
  [182, 70], // 16 ring tip
  [198, 182], // 17 pinky mcp
  [207, 147], // 18
  [212, 124], // 19
  [217, 100], // 20 pinky tip
];

const connections: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];

export function HandSkeleton({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 320"
      className={className}
      role="img"
      aria-label="Ilustrasi 21 titik landmark tangan seperti yang dideteksi SAPA di browser"
    >
      {connections.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={landmarks[a][0]}
          y1={landmarks[a][1]}
          x2={landmarks[b][0]}
          y2={landmarks[b][1]}
          stroke="var(--border)"
          strokeWidth={1.5}
        />
      ))}
      {landmarks.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === 0 ? 5 : 3.5}
          fill={i === 0 || i === 4 || i === 8 || i === 12 || i === 16 || i === 20 ? "var(--accent)" : "var(--background)"}
          stroke="var(--accent)"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}
