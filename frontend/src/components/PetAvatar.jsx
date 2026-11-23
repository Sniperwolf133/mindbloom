import { useState } from "react";

const THEME_COLORS = {
  lavender: {
    fur: "#EFEAFF",
    furShade: "#DDD2FC",
    earInner: "#F8C8DC",
    accent: "#8B6FE3",
    aura: "rgba(167, 142, 240, 0.28)",
    cheek: "#F8BBD0",
  },
  mint: {
    fur: "#E8FAF1",
    furShade: "#CBEEDB",
    earInner: "#F9CDD5",
    accent: "#4BA880",
    aura: "rgba(104, 193, 154, 0.28)",
    cheek: "#F6B8C4",
  },
  peach: {
    fur: "#FFF0E5",
    furShade: "#FCDAC4",
    earInner: "#FBC7B8",
    accent: "#DF8251",
    aura: "rgba(242, 160, 114, 0.28)",
    cheek: "#F7A698",
  },
  sky: {
    fur: "#EAF5FE",
    furShade: "#CEE5FA",
    earInner: "#F7C9DA",
    accent: "#4A92D4",
    aura: "rgba(107, 174, 232, 0.28)",
    cheek: "#F6B9CD",
  },
};

const MOOD_ANIMATIONS = {
  happy: "animate-happy-bounce",
  excited: "animate-happy-bounce",
  calm: "animate-breathe-slow",
  sleepy: "animate-float-slow",
  sad: "animate-breathe-slow",
};

export default function PetAvatar({
  species = "cat",
  colorTheme = "lavender",
  mood = "calm",
  accessory = "sprout",
  stage = 1,
  size = 180,
  interactive = true,
  onPetClick,
}) {
  const [burstHearts, setBurstHearts] = useState(false);
  const palette = THEME_COLORS[colorTheme] || THEME_COLORS.lavender;

  const isFox = species === "fox";
  const bodyColor = isFox ? (colorTheme === "lavender" ? "#FAD9C1" : palette.fur) : palette.fur;
  const shadeColor = isFox ? (colorTheme === "lavender" ? "#F2BE9B" : palette.furShade) : palette.furShade;
  const strokeColor = "#4F4668";

  const handleClick = () => {
    if (!interactive) return;
    setBurstHearts(true);
    setTimeout(() => setBurstHearts(false), 900);
    if (onPetClick) onPetClick();
  };

  return (
    <div
      onClick={handleClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
      title={interactive ? "Give your companion a gentle pat!" : undefined}
      className={`relative inline-flex items-center justify-center select-none ${
        interactive ? "cursor-pointer group" : ""
      }`}
      style={{ width: size, height: size }}
    >
      {/* Cozy glowing aura (stronger at higher growth stages) */}
      <div
        className={`absolute inset-3 rounded-full blur-xl transition-all duration-500 ${
          stage >= 2 ? "animate-pulse-glow" : "opacity-60"
        }`}
        style={{ backgroundColor: palette.aura }}
      />

      {/* Interactive click heart burst */}
      {burstHearts && (
        <div className="pointer-events-none absolute -top-2 inset-x-0 flex justify-center gap-3 z-20">
          <span className="text-pink-400 text-lg animate-bounce">♥</span>
          <span className="text-lavender-500 text-sm animate-ping">✦</span>
          <span className="text-pink-400 text-base animate-bounce">♥</span>
        </div>
      )}

      <svg
        viewBox="0 0 220 220"
        className={`relative z-10 w-full h-full drop-shadow-sm transition-transform duration-300 ${
          MOOD_ANIMATIONS[mood] || "animate-breathe-slow"
        } ${interactive ? "group-hover:scale-105" : ""} ${
          burstHearts ? "animate-wiggle-soft" : ""
        }`}
        aria-label={`${species} companion feeling ${mood}`}
      >
        {/* Ground shadow */}
        <ellipse cx="110" cy="196" rx="56" ry="10" fill="#DCD5EE" opacity="0.55" />

        {/* Stage 2+ Sparkle Aura Rings */}
        {stage >= 2 && (
          <g opacity="0.7">
            <circle cx="38" cy="70" r="3.5" fill={palette.accent} className="pet-float-particle" />
            <circle cx="184" cy="76" r="3" fill="#F2A072" className="pet-float-particle" />
          </g>
        )}
        {stage >= 3 && (
          <g opacity="0.85">
            <path d="M178 44 L181 50 L187 53 L181 56 L178 62 L175 56 L169 53 L175 50 Z" fill="#F4C55E" />
            <path d="M40 48 L42 53 L47 55 L42 57 L40 62 L38 57 L33 55 L38 53 Z" fill="#A78EF0" />
          </g>
        )}

        {/* Species-specific Tail */}
        {species === "cat" && (
          <path
            d="M152 162 C186 160, 194 128, 174 114 C166 109, 159 118, 165 126 C174 137, 166 148, 148 149"
            fill={bodyColor}
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}
        {species === "bunny" && (
          <circle
            cx="158"
            cy="158"
            r="14"
            fill="#FFFFFF"
            stroke={strokeColor}
            strokeWidth="3.2"
          />
        )}
        {species === "fox" && (
          <g>
            <path
              d="M148 164 C188 164, 200 124, 178 106 C164 108, 154 128, 144 148 Z"
              fill={bodyColor}
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path
              d="M178 106 C188 112, 190 124, 181 133 C172 130, 168 122, 170 113 Z"
              fill="#FFFDF9"
            />
          </g>
        )}

        {/* Ears (Behind Head) */}
        {species === "cat" && (
          <g>
            <path
              d="M64 82 L56 40 C55 34, 62 32, 66 36 L94 62 Z"
              fill={bodyColor}
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path d="M67 74 L63 48 L86 64 Z" fill={palette.earInner} />
            <path
              d="M156 82 L164 40 C165 34, 158 32, 154 36 L126 62 Z"
              fill={bodyColor}
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path d="M153 74 L157 48 L134 64 Z" fill={palette.earInner} />
          </g>
        )}

        {species === "bunny" && (
          <g>
            <ellipse
              cx="84"
              cy="46"
              rx="14"
              ry="34"
              transform="rotate(-10 84 46)"
              fill={bodyColor}
              stroke={strokeColor}
              strokeWidth="3.5"
            />
            <ellipse
              cx="85"
              cy="48"
              rx="7.5"
              ry="22"
              transform="rotate(-10 85 48)"
              fill={palette.earInner}
            />
            <ellipse
              cx="136"
              cy="46"
              rx="14"
              ry="34"
              transform="rotate(10 136 46)"
              fill={bodyColor}
              stroke={strokeColor}
              strokeWidth="3.5"
            />
            <ellipse
              cx="135"
              cy="48"
              rx="7.5"
              ry="22"
              transform="rotate(10 135 48)"
              fill={palette.earInner}
            />
          </g>
        )}

        {species === "fox" && (
          <g>
            <path
              d="M62 84 L50 34 C49 29, 55 27, 60 31 L95 62 Z"
              fill={bodyColor}
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path d="M64 73 L57 42 L85 62 Z" fill="#5D4E6D" />
            <path
              d="M158 84 L170 34 C171 29, 165 27, 160 31 L125 62 Z"
              fill={bodyColor}
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path d="M156 73 L163 42 L135 62 Z" fill="#5D4E6D" />
          </g>
        )}

        {/* Chubby Cozy Body */}
        <path
          d="M68 134 C62 162, 68 188, 110 188 C152 188, 158 162, 152 134 Z"
          fill={bodyColor}
          stroke={strokeColor}
          strokeWidth="3.5"
        />
        {/* Belly Patch */}
        <ellipse cx="110" cy="162" rx="28" ry="22" fill="#FFFDF9" opacity="0.88" />

        {/* Head */}
        <ellipse
          cx="110"
          cy="104"
          rx="52"
          ry="44"
          fill={bodyColor}
          stroke={strokeColor}
          strokeWidth="3.5"
        />

        {/* Fox Cream Cheek Markings */}
        {isFox && (
          <path
            d="M60 112 C74 106, 92 114, 110 124 C128 114, 146 106, 160 112 C154 134, 134 147, 110 147 C86 147, 66 134, 60 112 Z"
            fill="#FFFDF9"
            opacity="0.92"
          />
        )}

        {/* Rosy Cheeks */}
        <ellipse cx="77" cy="116" rx="9" ry="5.5" fill={palette.cheek} opacity="0.72" />
        <ellipse cx="143" cy="116" rx="9" ry="5.5" fill={palette.cheek} opacity="0.72" />

        {/* Mood-Based Eyes */}
        {mood === "happy" && (
          <g stroke={strokeColor} strokeWidth="3.6" strokeLinecap="round" fill="none">
            <path d="M82 103 Q90 93 98 103" />
            <path d="M122 103 Q130 93 138 103" />
          </g>
        )}

        {mood === "excited" && (
          <g>
            <g className="pet-eye-blink">
              <circle cx="90" cy="101" r="7.5" fill={strokeColor} />
              <circle cx="87.5" cy="98.5" r="2.6" fill="#FFFFFF" />
              <circle cx="93" cy="103" r="1.4" fill="#FFFFFF" />
              <circle cx="130" cy="101" r="7.5" fill={strokeColor} />
              <circle cx="127.5" cy="98.5" r="2.6" fill="#FFFFFF" />
              <circle cx="133" cy="103" r="1.4" fill="#FFFFFF" />
            </g>
            <path d="M52 72 L54 77 L59 79 L54 81 L52 86 L50 81 L45 79 L50 77 Z" fill="#F4C55E" />
            <path d="M168 68 L170 73 L175 75 L170 77 L168 82 L166 77 L161 75 L166 73 Z" fill="#F4C55E" />
          </g>
        )}

        {mood === "calm" && (
          <g className="pet-eye-blink">
            <circle cx="90" cy="102" r="6" fill={strokeColor} />
            <circle cx="88" cy="100" r="2.1" fill="#FFFFFF" />
            <circle cx="130" cy="102" r="6" fill={strokeColor} />
            <circle cx="128" cy="100" r="2.1" fill="#FFFFFF" />
          </g>
        )}

        {mood === "sleepy" && (
          <g>
            <g stroke={strokeColor} strokeWidth="3.2" strokeLinecap="round" fill="none">
              <path d="M82 103 Q90 109 98 103" />
              <path d="M122 103 Q130 109 138 103" />
            </g>
            <text x="158" y="64" fill={palette.accent} fontSize="14" fontWeight="bold" className="pet-float-particle">
              z
            </text>
            <text x="170" y="50" fill={palette.accent} fontSize="11" fontWeight="bold" className="pet-float-particle">
              z
            </text>
          </g>
        )}

        {mood === "sad" && (
          <g>
            <circle cx="90" cy="103" r="6.2" fill={strokeColor} />
            <circle cx="88.5" cy="100.5" r="2.2" fill="#FFFFFF" />
            <circle cx="130" cy="103" r="6.2" fill={strokeColor} />
            <circle cx="128.5" cy="100.5" r="2.2" fill="#FFFFFF" />
            {/* Soft gentle worried brows */}
            <path d="M81 93 Q89 91 95 88" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M139 93 Q131 91 125 88" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        )}

        {/* Nose & Mouth */}
        <ellipse cx="110" cy="112" rx="4.5" ry="3.2" fill={isFox ? "#4F4668" : "#F08BA8"} />
        {mood === "sad" ? (
          <path d="M103 122 Q110 117 117 122" stroke={strokeColor} strokeWidth="2.8" strokeLinecap="round" fill="none" />
        ) : mood === "excited" ? (
          <path d="M101 117 Q110 128 119 117 Z" fill="#F28FA8" stroke={strokeColor} strokeWidth="2.4" />
        ) : (
          <g stroke={strokeColor} strokeWidth="2.8" strokeLinecap="round" fill="none">
            <path d="M102 117 Q106 122 110 117" />
            <path d="M110 117 Q114 122 118 117" />
          </g>
        )}

        {/* Cat Whiskers */}
        {species === "cat" && (
          <g stroke={strokeColor} strokeWidth="2" strokeLinecap="round" opacity="0.55">
            <line x1="65" y1="108" x2="46" y2="105" />
            <line x1="65" y1="115" x2="45" y2="117" />
            <line x1="155" y1="108" x2="174" y2="105" />
            <line x1="155" y1="115" x2="175" y2="117" />
          </g>
        )}

        {/* Little Paws */}
        <ellipse cx="86" cy="164" rx="11" ry="8" fill={shadeColor} stroke={strokeColor} strokeWidth="3" />
        <ellipse cx="134" cy="164" rx="11" ry="8" fill={shadeColor} stroke={strokeColor} strokeWidth="3" />

        {/* === UNLOCKABLE ACCESSORIES === */}
        {accessory === "sprout" && (
          <g>
            <path d="M110 61 Q110 46 113 40" stroke="#4BA880" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <path d="M112 43 C102 32, 90 38, 96 47 C101 52, 108 49, 112 43 Z" fill="#77D1A6" stroke="#378A67" strokeWidth="2" />
            <path d="M113 41 C124 30, 134 38, 128 46 C123 51, 117 47, 113 41 Z" fill="#9AE2BF" stroke="#378A67" strokeWidth="2" />
          </g>
        )}

        {accessory === "scarf" && (
          <g>
            <path
              d="M74 138 Q110 151 146 138 Q148 148 140 153 Q110 163 80 153 Q72 148 74 138 Z"
              fill="#B39DF2"
              stroke={strokeColor}
              strokeWidth="2.6"
            />
            <path
              d="M122 148 L134 176 L119 178 L112 152 Z"
              fill="#9C84E8"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </g>
        )}

        {accessory === "glasses" && (
          <g stroke="#4E4668" strokeWidth="2.6" fill="rgba(255,255,255,0.22)">
            <circle cx="90" cy="102" r="13.5" />
            <circle cx="130" cy="102" r="13.5" />
            <line x1="103.5" y1="102" x2="116.5" y2="102" />
            <line x1="65" y1="99" x2="76.5" y2="101" />
            <line x1="143.5" y1="101" x2="155" y2="99" />
          </g>
        )}

        {accessory === "beanie" && (
          <g>
            <path
              d="M72 78 C75 46, 145 46, 148 78 Z"
              fill="#84D3B0"
              stroke={strokeColor}
              strokeWidth="2.8"
            />
            <rect
              x="68"
              y="72"
              width="84"
              height="14"
              rx="7"
              fill="#AEE6CC"
              stroke={strokeColor}
              strokeWidth="2.8"
            />
            <circle cx="110" cy="48" r="8" fill="#FFFDF9" stroke={strokeColor} strokeWidth="2.5" />
          </g>
        )}

        {accessory === "flower_crown" && (
          <g>
            <path d="M74 68 Q110 56 146 68" stroke="#5EB893" strokeWidth="3.5" fill="none" />
            {[82, 100, 120, 138].map((cx, i) => (
              <g key={cx}>
                <circle
                  cx={cx}
                  cy={i === 1 || i === 2 ? 60 : 65}
                  r="7.5"
                  fill={i % 2 === 0 ? "#F8BBD0" : "#DCD0FB"}
                  stroke={strokeColor}
                  strokeWidth="1.8"
                />
                <circle cx={cx} cy={i === 1 || i === 2 ? 60 : 65} r="2.8" fill="#F9D976" />
              </g>
            ))}
          </g>
        )}

        {accessory === "mug" && (
          <g>
            <path d="M148 158 L168 158 L165 182 L151 182 Z" fill="#FFE6D5" stroke={strokeColor} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M167 163 C175 163, 175 174, 166 174" stroke={strokeColor} strokeWidth="2.4" fill="none" />
            <path d="M155 150 Q153 144 156 139" stroke="#B7B0C9" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M162 150 Q160 144 163 139" stroke="#B7B0C9" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        )}

        {accessory === "star_badge" && (
          <g>
            <path
              d="M110 144 L113.5 151 L121 152 L115.5 157 L117 164.5 L110 160.8 L103 164.5 L104.5 157 L99 152 L106.5 151 Z"
              fill="#F9D56E"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

