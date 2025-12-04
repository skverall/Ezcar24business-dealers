import React, { useState } from 'react';

const CarInspectionReport = () => {
    const [carInfo, setCarInfo] = useState({
        brand: '',
        model: '',
        year: '',
        mileage: '',
        vin: '',
        date: new Date().toLocaleDateString('ru-RU')
    });

    const [ratings, setRatings] = useState<{
        engine: 'good' | 'warning' | 'bad' | null;
        gearbox: 'good' | 'warning' | 'bad' | null;
        suspension: 'good' | 'warning' | 'bad' | null;
        verdict: 'good' | 'warning' | 'bad' | null;
    }>({
        engine: null,
        gearbox: null,
        suspension: null,
        verdict: null
    });

    const [tyres, setTyres] = useState({
        year: '',
        condition: '',
        brand: ''
    });

    const [extras, setExtras] = useState({
        gcc: '',
        accident: '',
        keys: ''
    });

    const [comment, setComment] = useState('');

    const [bodyParts, setBodyParts] = useState<Record<string, 'original' | 'painted' | 'replaced' | 'putty'>>({
        hood: 'original',
        roof: 'original',
        trunk: 'original',
        frontBumper: 'original',
        rearBumper: 'original',
        frontLeftFender: 'original',
        frontRightFender: 'original',
        rearLeftFender: 'original',
        rearRightFender: 'original',
        frontLeftDoor: 'original',
        frontRightDoor: 'original',
        rearLeftDoor: 'original',
        rearRightDoor: 'original'
    });

    const paintColors: Record<string, string> = {
        original: '#2A2A2A',
        painted: '#FFB800',
        replaced: '#FF4444',
        putty: '#FF8C00'
    };

    const StatusButton = ({ value, current, onClick, label }: { value: string, current: string | null, onClick: (v: any) => void, label: string }) => (
        <button
            onClick={() => onClick(value)}
            style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                background: current === value
                    ? value === 'good' ? '#10B981'
                        : value === 'warning' ? '#F59E0B'
                            : '#EF4444'
                    : '#1F1F1F',
                color: current === value ? '#000' : '#666',
                transform: current === value ? 'scale(1.05)' : 'scale(1)'
            }}
        >
            {label}
        </button>
    );

    const BodyPartButton = ({ part, label }: { part: string, label: string }) => (
        <button
            onClick={() => {
                const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                const currentIndex = states.indexOf(bodyParts[part]);
                const nextIndex = (currentIndex + 1) % states.length;
                setBodyParts({ ...bodyParts, [part]: states[nextIndex] });
            }}
            style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                border: 'none',
                cursor: 'pointer',
                background: paintColors[bodyParts[part]],
                transition: 'all 0.2s ease',
                fontSize: '9px',
                color: bodyParts[part] === 'original' ? '#666' : '#000',
                fontWeight: '600'
            }}
            title={`${label}: ${bodyParts[part]}`}
        />
    );

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0A0A0A',
            padding: '32px',
            fontFamily: "'DM Sans', sans-serif"
        }}>
            <style>
                {`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
          
          input, select, textarea {
            background: #1A1A1A !important;
            border: 1px solid #333 !important;
            color: #fff !important;
            padding: 12px 16px !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            font-family: 'DM Sans', sans-serif !important;
            transition: border-color 0.2s ease !important;
          }
          
          input:focus, select:focus, textarea:focus {
            outline: none !important;
            border-color: #FFB800 !important;
          }
          
          input::placeholder, textarea::placeholder {
            color: #555 !important;
          }
        `}
            </style>

            <div style={{
                maxWidth: '900px',
                margin: '0 auto',
                background: '#111',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid #222'
            }}>

                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #FFB800 0%, #FF8C00 100%)',
                    padding: '32px 40px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        right: '-10%',
                        width: '300px',
                        height: '300px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%'
                    }} />
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            background: '#000',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '28px'
                        }}>
                            🚗
                        </div>
                        <div>
                            <h1 style={{
                                margin: 0,
                                fontSize: '28px',
                                fontWeight: '700',
                                color: '#000',
                                letterSpacing: '-0.5px'
                            }}>
                                CAR INSPECTION REPORT
                            </h1>
                            <p style={{
                                margin: '4px 0 0 0',
                                fontSize: '14px',
                                color: 'rgba(0,0,0,0.6)',
                                fontFamily: "'JetBrains Mono', monospace"
                            }}>
                                {carInfo.date}
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '32px 40px' }}>

                    {/* Car Info */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px',
                        marginBottom: '32px'
                    }}>
                        <input
                            placeholder="Brand (Toyota, BMW...)"
                            value={carInfo.brand}
                            onChange={(e) => setCarInfo({ ...carInfo, brand: e.target.value })}
                        />
                        <input
                            placeholder="Model"
                            value={carInfo.model}
                            onChange={(e) => setCarInfo({ ...carInfo, model: e.target.value })}
                        />
                        <input
                            placeholder="Year"
                            value={carInfo.year}
                            onChange={(e) => setCarInfo({ ...carInfo, year: e.target.value })}
                        />
                        <input
                            placeholder="Mileage (km)"
                            value={carInfo.mileage}
                            onChange={(e) => setCarInfo({ ...carInfo, mileage: e.target.value })}
                        />
                        <input
                            placeholder="VIN"
                            value={carInfo.vin}
                            onChange={(e) => setCarInfo({ ...carInfo, vin: e.target.value })}
                            style={{ gridColumn: 'span 2' }}
                        />
                    </div>

                    {/* Section 1: Photos */}
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#FFB800',
                            letterSpacing: '2px',
                            margin: '0 0 16px 0',
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>
                            01 — PHOTOS
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '12px'
                        }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} style={{
                                    aspectRatio: '4/3',
                                    background: '#1A1A1A',
                                    borderRadius: '12px',
                                    border: '2px dashed #333',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}>
                                    <span style={{ fontSize: '24px', opacity: 0.3 }}>📷</span>
                                    <span style={{
                                        fontSize: '11px',
                                        color: '#444',
                                        marginTop: '8px',
                                        fontFamily: "'JetBrains Mono', monospace"
                                    }}>
                                        Photo {i}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Body Scheme */}
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#FFB800',
                            letterSpacing: '2px',
                            margin: '0 0 16px 0',
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>
                            02 — BODY PAINT SCHEME
                        </h2>

                        <div style={{
                            display: 'flex',
                            gap: '24px',
                            alignItems: 'flex-start'
                        }}>
                            {/* Car top view */}
                            <div style={{
                                position: 'relative',
                                width: '200px',
                                height: '400px',
                                background: '#1A1A1A',
                                borderRadius: '16px',
                                padding: '20px',
                                flexShrink: 0
                            }}>
                                <svg viewBox="0 0 160 360" style={{ width: '100%', height: '100%' }}>
                                    {/* Car outline */}
                                    <defs>
                                        <filter id="glow">
                                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                            <feMerge>
                                                <feMergeNode in="coloredBlur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>

                                    {/* Front Bumper */}
                                    <rect x="20" y="10" width="120" height="25" rx="8"
                                        fill={paintColors[bodyParts.frontBumper]}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                            const currentIndex = states.indexOf(bodyParts.frontBumper);
                                            setBodyParts({ ...bodyParts, frontBumper: states[(currentIndex + 1) % 4] });
                                        }}
                                    />

                                    {/* Hood */}
                                    <rect x="25" y="40" width="110" height="60" rx="4"
                                        fill={paintColors[bodyParts.hood]}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                            const currentIndex = states.indexOf(bodyParts.hood);
                                            setBodyParts({ ...bodyParts, hood: states[(currentIndex + 1) % 4] });
                                        }}
                                    />

                                    {/* Front Left Fender */}
                                    <rect x="10" y="40" width="12" height="70" rx="2"
                                        fill={paintColors[bodyParts.frontLeftFender]}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                            const currentIndex = states.indexOf(bodyParts.frontLeftFender);
                                            setBodyParts({ ...bodyParts, frontLeftFender: states[(currentIndex + 1) % 4] });
                                        }}
                                    />

                                    {/* Front Right Fender */}
                                    <rect x="138" y="40" width="12" height="70" rx="2"
                                        fill={paintColors[bodyParts.frontRightFender]}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                            const currentIndex = states.indexOf(bodyParts.frontRightFender);
                                            setBodyParts({ ...bodyParts, frontRightFender: states[(currentIndex + 1) % 4] });
                                        }}
                                    />

                                    {/* Roof / Windshield area */}
                                    <rect x="25" y="105" width="110" height="80" rx="4"
                                        fill={paintColors[bodyParts.roof]}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                            const currentIndex = states.indexOf(bodyParts.roof);
                                            setBodyParts({ ...bodyParts, roof: states[(currentIndex + 1) % 4] });
                                        }}
                                    />

                                    {/* Front Left Door */}
                                    <rect x="10" y="115" width="12" height="55" rx="2"
                                        fill={paintColors[bodyParts.frontLeftDoor]}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                            const currentIndex = states.indexOf(bodyParts.frontLeftDoor);
                                            setBodyParts({ ...bodyParts, frontLeftDoor: states[(currentIndex + 1) % 4] });
                                        }}
                                    />

                                    {/* Front Right Door */}
                                    <rect x="138" y="115" width="12" height="55" rx="2"
                                        fill={paintColors[bodyParts.frontRightDoor]}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                            const currentIndex = states.indexOf(bodyParts.frontRightDoor);
                                            setBodyParts({ ...bodyParts, frontRightDoor: states[(currentIndex + 1) % 4] });
                                        }}
                                    />

                                    {/* Rear Left Door */}
                                    <rect x="10" y="175" width="12" height="55" rx="2"
                                        fill={paintColors[bodyParts.rearLeftDoor]}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                            const currentIndex = states.indexOf(bodyParts.rearLeftDoor);
                                            setBodyParts({ ...bodyParts, rearLeftDoor: states[(currentIndex + 1) % 4] });
                                        }}
                                    />

                                    {/* Rear Right Door */}
                                    <rect x="138" y="175" width="12" height="55" rx="2"
                                        fill={paintColors[bodyParts.rearRightDoor]}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                            const currentIndex = states.indexOf(bodyParts.rearRightDoor);
                                            setBodyParts({ ...bodyParts, rearRightDoor: states[(currentIndex + 1) % 4] });
                                        }}
                                    />

                                    {/* Rear section */}
                                    <rect x="25" y="190" width="110" height="80" rx="4"
                                        fill={paintColors[bodyParts.trunk]}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                            const currentIndex = states.indexOf(bodyParts.trunk);
                                            setBodyParts({ ...bodyParts, trunk: states[(currentIndex + 1) % 4] });
                                        }}
                                    />

                                    {/* Rear Left Fender */}
                                    <rect x="10" y="235" width="12" height="70" rx="2"
                                        fill={paintColors[bodyParts.rearLeftFender]}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                            const currentIndex = states.indexOf(bodyParts.rearLeftFender);
                                            setBodyParts({ ...bodyParts, rearLeftFender: states[(currentIndex + 1) % 4] });
                                        }}
                                    />

                                    {/* Rear Right Fender */}
                                    <rect x="138" y="235" width="12" height="70" rx="2"
                                        fill={paintColors[bodyParts.rearRightFender]}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                            const currentIndex = states.indexOf(bodyParts.rearRightFender);
                                            setBodyParts({ ...bodyParts, rearRightFender: states[(currentIndex + 1) % 4] });
                                        }}
                                    />

                                    {/* Rear Bumper */}
                                    <rect x="20" y="275" width="120" height="25" rx="8"
                                        fill={paintColors[bodyParts.rearBumper]}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                            const currentIndex = states.indexOf(bodyParts.rearBumper);
                                            setBodyParts({ ...bodyParts, rearBumper: states[(currentIndex + 1) % 4] });
                                        }}
                                    />

                                    {/* Wheels */}
                                    <circle cx="25" cy="55" r="15" fill="#0A0A0A" stroke="#333" strokeWidth="2" />
                                    <circle cx="135" cy="55" r="15" fill="#0A0A0A" stroke="#333" strokeWidth="2" />
                                    <circle cx="25" cy="260" r="15" fill="#0A0A0A" stroke="#333" strokeWidth="2" />
                                    <circle cx="135" cy="260" r="15" fill="#0A0A0A" stroke="#333" strokeWidth="2" />

                                    {/* Labels */}
                                    <text x="80" y="28" textAnchor="middle" fill="#000" fontSize="8" fontWeight="600">FRONT</text>
                                    <text x="80" y="292" textAnchor="middle" fill="#000" fontSize="8" fontWeight="600">REAR</text>
                                </svg>

                                <p style={{
                                    textAlign: 'center',
                                    fontSize: '10px',
                                    color: '#666',
                                    margin: '8px 0 0 0'
                                }}>
                                    Click parts to cycle status
                                </p>
                            </div>

                            {/* Legend */}
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '8px',
                                    marginBottom: '16px'
                                }}>
                                    {[
                                        { color: '#2A2A2A', label: 'Original', key: 'original' },
                                        { color: '#FFB800', label: 'Painted', key: 'painted' },
                                        { color: '#FF4444', label: 'Replaced', key: 'replaced' },
                                        { color: '#FF8C00', label: 'Putty/Filler', key: 'putty' }
                                    ].map(item => (
                                        <div key={item.key} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 12px',
                                            background: '#1A1A1A',
                                            borderRadius: '8px'
                                        }}>
                                            <div style={{
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '4px',
                                                background: item.color
                                            }} />
                                            <span style={{
                                                fontSize: '12px',
                                                color: '#888',
                                                fontFamily: "'JetBrains Mono', monospace"
                                            }}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{
                                    background: '#1A1A1A',
                                    borderRadius: '12px',
                                    padding: '16px'
                                }}>
                                    <p style={{
                                        fontSize: '11px',
                                        color: '#666',
                                        margin: '0 0 12px 0',
                                        fontFamily: "'JetBrains Mono', monospace"
                                    }}>
                                        PAINTED PARTS:
                                    </p>
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '6px'
                                    }}>
                                        {Object.entries(bodyParts)
                                            .filter(([_, status]) => status !== 'original')
                                            .map(([part, status]) => (
                                                <span key={part} style={{
                                                    padding: '4px 10px',
                                                    background: paintColors[status],
                                                    borderRadius: '4px',
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    color: '#000',
                                                    fontFamily: "'JetBrains Mono', monospace"
                                                }}>
                                                    {part.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                            ))
                                        }
                                        {Object.values(bodyParts).every(s => s === 'original') && (
                                            <span style={{ fontSize: '12px', color: '#10B981' }}>
                                                ✓ All original
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sections 3-5: Technical */}
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#FFB800',
                            letterSpacing: '2px',
                            margin: '0 0 16px 0',
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>
                            03-05 — TECHNICAL CONDITION
                        </h2>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {[
                                { key: 'engine', label: 'ENGINE', icon: '⚙️' },
                                { key: 'gearbox', label: 'GEARBOX', icon: '🔧' },
                                { key: 'suspension', label: 'SUSPENSION', icon: '🛞' }
                            ].map(item => (
                                <div key={item.key} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px 20px',
                                    background: '#1A1A1A',
                                    borderRadius: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                                        <span style={{
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#fff',
                                            letterSpacing: '1px'
                                        }}>
                                            {item.label}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <StatusButton
                                            value="good"
                                            current={ratings[item.key as keyof typeof ratings]}
                                            onClick={(v) => setRatings({ ...ratings, [item.key]: v })}
                                            label="✅ Good"
                                        />
                                        <StatusButton
                                            value="warning"
                                            current={ratings[item.key as keyof typeof ratings]}
                                            onClick={(v) => setRatings({ ...ratings, [item.key]: v })}
                                            label="⚠️ Issues"
                                        />
                                        <StatusButton
                                            value="bad"
                                            current={ratings[item.key as keyof typeof ratings]}
                                            onClick={(v) => setRatings({ ...ratings, [item.key]: v })}
                                            label="❌ Bad"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 6: Tyres */}
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#FFB800',
                            letterSpacing: '2px',
                            margin: '0 0 16px 0',
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>
                            06 — TYRES
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '12px'
                        }}>
                            <input
                                placeholder="Brand (Michelin, Pirelli...)"
                                value={tyres.brand}
                                onChange={(e) => setTyres({ ...tyres, brand: e.target.value })}
                            />
                            <input
                                placeholder="Year (2022)"
                                value={tyres.year}
                                onChange={(e) => setTyres({ ...tyres, year: e.target.value })}
                            />
                            <input
                                placeholder="Condition (80%, new...)"
                                value={tyres.condition}
                                onChange={(e) => setTyres({ ...tyres, condition: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Section 7: GCC / Accident / Keys */}
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#FFB800',
                            letterSpacing: '2px',
                            margin: '0 0 16px 0',
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>
                            07 — ADDITIONAL INFO
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '12px'
                        }}>
                            <div style={{
                                background: '#1A1A1A',
                                borderRadius: '12px',
                                padding: '16px',
                                textAlign: 'center'
                            }}>
                                <p style={{
                                    margin: '0 0 8px 0',
                                    fontSize: '11px',
                                    color: '#666',
                                    fontFamily: "'JetBrains Mono', monospace"
                                }}>GCC SPECS</p>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => setExtras({ ...extras, gcc: 'yes' })}
                                        style={{
                                            padding: '8px 16px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            background: extras.gcc === 'yes' ? '#10B981' : '#2A2A2A',
                                            color: extras.gcc === 'yes' ? '#000' : '#666',
                                            fontWeight: '600'
                                        }}
                                    >Yes</button>
                                    <button
                                        onClick={() => setExtras({ ...extras, gcc: 'no' })}
                                        style={{
                                            padding: '8px 16px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            background: extras.gcc === 'no' ? '#EF4444' : '#2A2A2A',
                                            color: extras.gcc === 'no' ? '#000' : '#666',
                                            fontWeight: '600'
                                        }}
                                    >No</button>
                                </div>
                            </div>

                            <div style={{
                                background: '#1A1A1A',
                                borderRadius: '12px',
                                padding: '16px',
                                textAlign: 'center'
                            }}>
                                <p style={{
                                    margin: '0 0 8px 0',
                                    fontSize: '11px',
                                    color: '#666',
                                    fontFamily: "'JetBrains Mono', monospace"
                                }}>ACCIDENT HISTORY</p>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => setExtras({ ...extras, accident: 'clean' })}
                                        style={{
                                            padding: '8px 16px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            background: extras.accident === 'clean' ? '#10B981' : '#2A2A2A',
                                            color: extras.accident === 'clean' ? '#000' : '#666',
                                            fontWeight: '600'
                                        }}
                                    >Clean</button>
                                    <button
                                        onClick={() => setExtras({ ...extras, accident: 'accident' })}
                                        style={{
                                            padding: '8px 16px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            background: extras.accident === 'accident' ? '#EF4444' : '#2A2A2A',
                                            color: extras.accident === 'accident' ? '#000' : '#666',
                                            fontWeight: '600'
                                        }}
                                    >Accident</button>
                                </div>
                            </div>

                            <div style={{
                                background: '#1A1A1A',
                                borderRadius: '12px',
                                padding: '16px',
                                textAlign: 'center'
                            }}>
                                <p style={{
                                    margin: '0 0 8px 0',
                                    fontSize: '11px',
                                    color: '#666',
                                    fontFamily: "'JetBrains Mono', monospace"
                                }}>KEYS</p>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    {['1', '2', '2+'].map(k => (
                                        <button
                                            key={k}
                                            onClick={() => setExtras({ ...extras, keys: k })}
                                            style={{
                                                padding: '8px 16px',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                background: extras.keys === k ? '#FFB800' : '#2A2A2A',
                                                color: extras.keys === k ? '#000' : '#666',
                                                fontWeight: '600'
                                            }}
                                        >{k}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 8: Verdict */}
                    <div style={{
                        background: 'linear-gradient(135deg, #1A1A1A 0%, #222 100%)',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid #333'
                    }}>
                        <h2 style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#FFB800',
                            letterSpacing: '2px',
                            margin: '0 0 20px 0',
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>
                            08 — FINAL VERDICT
                        </h2>

                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            marginBottom: '20px'
                        }}>
                            <button
                                onClick={() => setRatings({ ...ratings, verdict: 'bad' })}
                                style={{
                                    flex: 1,
                                    padding: '20px',
                                    border: ratings.verdict === 'bad' ? '2px solid #EF4444' : '2px solid transparent',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    background: ratings.verdict === 'bad' ? 'rgba(239,68,68,0.2)' : '#1A1A1A',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>❌</span>
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: ratings.verdict === 'bad' ? '#EF4444' : '#666'
                                }}>
                                    DON'T BUY
                                </span>
                            </button>

                            <button
                                onClick={() => setRatings({ ...ratings, verdict: 'warning' })}
                                style={{
                                    flex: 1,
                                    padding: '20px',
                                    border: ratings.verdict === 'warning' ? '2px solid #F59E0B' : '2px solid transparent',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    background: ratings.verdict === 'warning' ? 'rgba(245,158,11,0.2)' : '#1A1A1A',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>⚠️</span>
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: ratings.verdict === 'warning' ? '#F59E0B' : '#666'
                                }}>
                                    CONDITIONAL
                                </span>
                            </button>

                            <button
                                onClick={() => setRatings({ ...ratings, verdict: 'good' })}
                                style={{
                                    flex: 1,
                                    padding: '20px',
                                    border: ratings.verdict === 'good' ? '2px solid #10B981' : '2px solid transparent',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    background: ratings.verdict === 'good' ? 'rgba(16,185,129,0.2)' : '#1A1A1A',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>✅</span>
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: ratings.verdict === 'good' ? '#10B981' : '#666'
                                }}>
                                    GOOD BUY
                                </span>
                            </button>
                        </div>

                        <textarea
                            placeholder="Additional comments, notes, recommendations..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px 40px',
                    borderTop: '1px solid #222',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <p style={{
                        margin: 0,
                        fontSize: '11px',
                        color: '#444',
                        fontFamily: "'JetBrains Mono', monospace"
                    }}>
                        CAR INSPECTION TEMPLATE v1.0
                    </p>
                    <p style={{
                        margin: 0,
                        fontSize: '11px',
                        color: '#444',
                        fontFamily: "'JetBrains Mono', monospace"
                    }}>
                        {carInfo.brand && carInfo.model ? `${carInfo.brand} ${carInfo.model}` : 'No car selected'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CarInspectionReport;
