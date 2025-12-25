// 일반 직사각형 좌석 배치
export function generateStandardSeats() {
    const seats = [];

    // 4 sections, each 5 cols x 8 rows
    // Spacing calculation:
    // Total Width: 1000
    // Section Width: ~175 (5 * 35)
    // Gap: ~60 ((1000 - 4*175) / 5)

    const startXPositions = [60, 295, 530, 765];
    const sectionNames = ["1구역", "2구역", "3구역", "4구역"];
    const sectionPrices = [80000, 100000, 100000, 80000];
    const rowCounts = [8, 10, 10, 8];

    for (let s = 0; s < 4; s++) {
        for (let row = 0; row < rowCounts[s]; row++) {
            for (let col = 0; col < 5; col++) {
                seats.push({
                    id: `${s + 1}-${row + 1}-${col + 1}`,
                    section: sectionNames[s],
                    row: row + 1,
                    number: col + 1,
                    x: startXPositions[s] + col * 35,
                    y: 174 + row * 35,
                    price: sectionPrices[s],
                    isBooked: false,
                });
            }
        }
    }

    return seats;
}

// 부채꼴 좌석 배치
export function generateFanSeats() {
    const seats = [];
    const centerX = 500;
    const centerY = 100;

    // 1구역 VIP - 앞쪽 부채꼴
    for (let row = 0; row < 8; row++) {
        const radius = 200 + row * 40;
        const angleStart = -50;
        const angleEnd = 50;
        const seatsInRow = 12 + row * 2;
        const angleStep = (angleEnd - angleStart) / (seatsInRow - 1);

        for (let i = 0; i < seatsInRow; i++) {
            const angle = (angleStart + i * angleStep) * Math.PI / 180;
            const x = centerX + radius * Math.sin(angle);
            const y = centerY + radius * Math.cos(angle);
            seats.push({
                id: `1-${row + 1}-${i + 1}`,
                section: '1구역(VIP)',
                row: row + 1,
                number: i + 1,
                x,
                y,
                price: 150000,
                isBooked: false,
            });
        }
    }

    // 2구역 - 중간 부채꼴
    for (let row = 0; row < 10; row++) {
        const radius = 520 + row * 35;
        const angleStart = -60;
        const angleEnd = 60;
        const seatsInRow = 18 + row * 2;
        const angleStep = (angleEnd - angleStart) / (seatsInRow - 1);

        for (let i = 0; i < seatsInRow; i++) {
            const angle = (angleStart + i * angleStep) * Math.PI / 180;
            const x = centerX + radius * Math.sin(angle);
            const y = centerY + radius * Math.cos(angle);
            seats.push({
                id: `2-${row + 1}-${i + 1}`,
                section: '2구역',
                row: row + 1,
                number: i + 1,
                x,
                y,
                price: 100000,
                isBooked: false,
            });
        }
    }

    return seats;
}

// 극장형 좌석 배치
export function generateTheaterSeats() {
    const seats = [];

    // 1층 1구역 (왼쪽) - 8x12 = 96개
    for (let row = 0; row < 12; row++) {
        for (let col = 0; col < 8; col++) {
            seats.push({
                id: `1-${row + 1}-${col + 1}`,
                section: '1층 1구역',
                row: row + 1,
                number: col + 1,
                x: 113 + col * 32,
                y: 213 + row * 32,
                price: 90000,
                isBooked: false,
            });
        }
    }

    // 1층 2구역 VIP (중앙) - 10x15 = 150개
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 10; col++) {
            seats.push({
                id: `2-${row + 1}-${col + 1}`,
                section: '1층 2구역(VIP)',
                row: row + 1,
                number: col + 1,
                x: 353 + col * 32,
                y: 213 + row * 32,
                price: 150000,
                isBooked: false,
            });
        }
    }

    // 1층 3구역 (오른쪽) - 8x12 = 96개
    for (let row = 0; row < 12; row++) {
        for (let col = 0; col < 8; col++) {
            seats.push({
                id: `3-${row + 1}-${col + 1}`,
                section: '1층 3구역',
                row: row + 1,
                number: col + 1,
                x: 693 + col * 32,
                y: 213 + row * 32,
                price: 90000,
                isBooked: false,
            });
        }
    }

    // 2층 4구역 (왼쪽 발코니) - 6x8 = 48개
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 6; col++) {
            seats.push({
                id: `4-${row + 1}-${col + 1}`,
                section: '2층 4구역',
                row: row + 1,
                number: col + 1,
                x: 133 + col * 32,
                y: 653 + row * 32,
                price: 70000,
                isBooked: false,
            });
        }
    }

    // 2층 5구역 (중앙 발코니) - 10x10 = 100개
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            seats.push({
                id: `5-${row + 1}-${col + 1}`,
                section: '2층 5구역',
                row: row + 1,
                number: col + 1,
                x: 353 + col * 32,
                y: 653 + row * 32,
                price: 80000,
                isBooked: false,
            });
        }
    }

    // 2층 6구역 (오른쪽 발코니) - 6x8 = 48개
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 6; col++) {
            seats.push({
                id: `6-${row + 1}-${col + 1}`,
                section: '2층 6구역',
                row: row + 1,
                number: col + 1,
                x: 713 + col * 32,
                y: 653 + row * 32,
                price: 70000,
                isBooked: false,
            });
        }
    }

    return seats;
}
