// 유틸리티 함수

/**
 * 숫자에 천 단위 콤마를 추가하여 포맷팅
 * @param {number} amount - 포맷팅할 숫자
 * @returns {string} 포맷팅된 문자열 (예: "10,000,000")
 */
function formatNumber(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '0';
    }
    return Math.round(amount).toLocaleString('ko-KR');
}

/**
 * 문자열에서 콤마와 % 기호를 제거하여 숫자로 변환
 * @param {string} value - 변환할 문자열
 * @returns {number} 변환된 숫자
 */
function parseNumber(value) {
    if (!value || value === '-') return 0;
    const cleaned = String(value).replace(/[,%]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * 입력 필드에 포맷팅된 값을 설정
 * @param {string} id - 입력 필드 ID
 * @param {number} value - 설정할 숫자 값
 * @param {boolean} isPercent - 퍼센트 형식인지 여부
 * @param {boolean} withWon - "원" 단위 추가 여부
 */
function setFormattedValue(id, value, isPercent = false, withWon = false) {
    const element = document.getElementById(id);
    if (element) {
        let formatted = formatNumber(value);
        if (isPercent) {
            formatted = `${formatted}%`;
        } else if (withWon) {
            formatted = `${formatted}원`;
        }
        element.value = formatted;
        
        // 한글 금액 표기 업데이트
        if (!isPercent) {
            updateKoreanAmount(id, value);
        }
    }
}

/**
 * 숫자를 한글 금액으로 변환
 * @param {number} amount - 변환할 숫자
 * @returns {string} 한글 금액 문자열 (예: "일천만원")
 */
function convertToKoreanAmount(amount) {
    if (amount === 0 || amount < 1) return '';
    
    const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    const units = ['', '십', '백', '천'];
    const largeUnits = ['', '만', '억', '조', '경'];
    
    let num = Math.floor(amount);
    if (num === 0) return '';
    
    let result = '';
    let unitIndex = 0;
    
    while (num > 0) {
        const segment = num % 10000;
        num = Math.floor(num / 10000);
        
        if (segment === 0) {
            unitIndex++;
            continue;
        }
        
        let segmentStr = '';
        let segmentNum = segment;
        let pos = 0;
        
        while (segmentNum > 0) {
            const digit = segmentNum % 10;
            segmentNum = Math.floor(segmentNum / 10);
            
            if (digit !== 0) {
                if (digit === 1 && pos > 0) {
                    segmentStr = units[pos] + segmentStr;
                } else {
                    segmentStr = digits[digit] + units[pos] + segmentStr;
                }
            }
            pos++;
        }
        
        if (unitIndex > 0) {
            result = segmentStr + largeUnits[unitIndex] + result;
        } else {
            result = segmentStr + result;
        }
        
        unitIndex++;
    }
    
    return result + '원';
}

/**
 * 한글 금액 표기 업데이트
 * @param {string} inputId - 입력 필드 ID
 * @param {number} amount - 금액
 */
function updateKoreanAmount(inputId, amount) {
    const koreanId = inputId + 'Korean';
    const koreanElement = document.getElementById(koreanId);
    if (koreanElement) {
        koreanElement.textContent = convertToKoreanAmount(amount);
    }
}

/**
 * 페이지 prefix를 사용하여 ID를 생성
 * @param {string} prefix - 페이지 prefix (예: "page1")
 * @param {string} id - 원본 ID (예: "totalCost")
 * @returns {string} 완전한 ID (예: "page1-totalCost")
 */
function getPageId(prefix, id) {
    return `${prefix}-${id}`;
}

/**
 * 보조사업자 입력값을 가져와 파일명에 사용할 수 있도록 정리
 * @param {string} pagePrefix - 페이지 prefix
 * @returns {string} 보조사업자명 (없으면 빈 문자열)
 */
function getSubsidyBusinessName(pagePrefix) {
    const el = document.getElementById(getPageId(pagePrefix, 'subsidyBusiness'));
    if (!el) return '';
    return (el.value || '').trim();
}

/**
 * PDF 저장 시 기본 파일명을 생성
 * @param {string} pagePrefix - 페이지 prefix
 * @param {boolean} isAllPages - 전체 페이지 여부
 * @returns {string} 파일명
 */
function buildPdfFileName(pagePrefix, isAllPages = false) {
    const base = '사업비산출내역';
    const business = getSubsidyBusinessName(pagePrefix);
    const suffix = business ? `_${business}` : '';
    const allSuffix = isAllPages ? '_전체' : '';
    return `${base}${suffix}${allSuffix}.pdf`;
}

// 계산 함수들 (페이지 prefix 지원)

/**
 * 총사업비 계산
 * @param {string} pagePrefix - 페이지 prefix (예: "page1")
 */
function calculateTotalCost(pagePrefix) {
    const subsidySum = parseNumber(document.getElementById(getPageId(pagePrefix, 'subsidyTotal')).value);
    const selfContributionSum = parseNumber(document.getElementById(getPageId(pagePrefix, 'selfContributionTotal')).value);
    const total = subsidySum + selfContributionSum;
    return total;
}

/**
 * 교부결정액 계산
 * @param {string} pagePrefix - 페이지 prefix
 */
function calculatePaymentDecision(pagePrefix) {
    const subsidyTotal = parseNumber(document.getElementById(getPageId(pagePrefix, 'subsidyTotal')).value);
    setFormattedValue(getPageId(pagePrefix, 'paymentDecision'), subsidyTotal, false, true);
    return subsidyTotal;
}

/**
 * 사업비 산출금액 계산
 * @param {string} pagePrefix - 페이지 prefix
 */
function calculateProjectCost(pagePrefix) {
    const totalCost = parseNumber(document.getElementById(getPageId(pagePrefix, 'totalCost')).value);
    const vatRefund = parseNumber(document.getElementById(getPageId(pagePrefix, 'vatRefund')).value);
    const otherExpenses = parseNumber(document.getElementById(getPageId(pagePrefix, 'otherExpenses')).value);
    const projectCost = totalCost - (vatRefund + otherExpenses);
    setFormattedValue(getPageId(pagePrefix, 'projectCost'), Math.max(0, projectCost), false, true);
    return Math.max(0, projectCost);
}

/**
 * 보조금 테이블 계산
 * @param {string} pagePrefix - 페이지 prefix
 */
function calculateSubsidyTable(pagePrefix) {
    const projectCost = parseNumber(document.getElementById(getPageId(pagePrefix, 'projectCost')).value);
    
    // 재원비율 입력값 가져오기 (직접입력)
    const nationalRatio = parseNumber(document.getElementById(getPageId(pagePrefix, 'nationalRatio')).value);
    const provincialRatio = parseNumber(document.getElementById(getPageId(pagePrefix, 'provincialRatio')).value);
    const cityRatio = parseNumber(document.getElementById(getPageId(pagePrefix, 'cityRatio')).value);
    
    // 재원비율의 소계 = 국비 + 도비 + 시비
    const totalRatio = nationalRatio + provincialRatio + cityRatio;
    setFormattedValue(getPageId(pagePrefix, 'totalRatio'), totalRatio, true);
    
    // 사업비 계산: 사업비 산출금액 * 재원비율
    const nationalAmount = (projectCost * nationalRatio) / 100;
    const provincialAmount = (projectCost * provincialRatio) / 100;
    const cityAmount = (projectCost * cityRatio) / 100;
    
    // 사업비 금액 설정 (자동 계산)
    setFormattedValue(getPageId(pagePrefix, 'nationalAmount'), nationalAmount);
    setFormattedValue(getPageId(pagePrefix, 'provincialAmount'), provincialAmount);
    setFormattedValue(getPageId(pagePrefix, 'cityAmount'), cityAmount);
    
    // 보조금 합계 계산
    const subsidySum = nationalAmount + provincialAmount + cityAmount;
    setFormattedValue(getPageId(pagePrefix, 'subsidyTotal'), subsidySum);
    
    return subsidySum;
}

/**
 * 자부담 테이블 계산
 * @param {string} pagePrefix - 페이지 prefix
 */
function calculateSelfContributionTable(pagePrefix) {
    const projectCost = parseNumber(document.getElementById(getPageId(pagePrefix, 'projectCost')).value);
    const vatRefund = parseNumber(document.getElementById(getPageId(pagePrefix, 'vatRefund')).value);
    const otherExpenses = parseNumber(document.getElementById(getPageId(pagePrefix, 'otherExpenses')).value);
    
    // 자부담율 (보조금매칭) 입력값 가져오기 (직접입력)
    const matchingRatio = parseNumber(document.getElementById(getPageId(pagePrefix, 'matchingRatio')).value);
    
    // 자부담 (보조금매칭) 계산: 사업비 산출금액 * 자부담율 (보조금매칭)
    const matchingAmount = (projectCost * matchingRatio) / 100;
    setFormattedValue(getPageId(pagePrefix, 'matchingAmount'), matchingAmount);
    
    // 소계 계산: 자부담(보조금매칭) + 부가가치세 환급액 + 기타부담금
    const selfContributionSum = matchingAmount + vatRefund + otherExpenses;
    setFormattedValue(getPageId(pagePrefix, 'selfContributionTotal'), selfContributionSum);
    
    return selfContributionSum;
}

/**
 * 부가가치세 환급대상 품목 테이블의 특정 행 계산
 * @param {string} pagePrefix - 페이지 prefix
 * @param {number} rowNum - 행 번호
 * @param {string} trigger - 계산 트리거 ('unitPriceOrQuantity': 단가/수량 변경, 'supplyAmount': 공급가액 변경)
 */
function calculateVatRefundItemRow(pagePrefix, rowNum, trigger = 'unitPriceOrQuantity') {
    const unitPriceElement = document.getElementById(getPageId(pagePrefix, `vatItemUnitPrice${rowNum}`));
    const quantityElement = document.getElementById(getPageId(pagePrefix, `vatItemQuantity${rowNum}`));
    const supplyAmountElement = document.getElementById(getPageId(pagePrefix, `vatItemSupplyAmount${rowNum}`));
    const taxAmountElement = document.getElementById(getPageId(pagePrefix, `vatItemTaxAmount${rowNum}`));
    
    if (!unitPriceElement || !quantityElement || !supplyAmountElement || !taxAmountElement) return;
    
    // 단가나 수량이 변경된 경우: 공급가액과 세액 모두 계산
    if (trigger === 'unitPriceOrQuantity') {
        const unitPrice = parseNumber(unitPriceElement.value);
        const quantity = parseNumber(quantityElement.value);
        
        if (unitPrice > 0 && quantity > 0) {
            // 공급가액 = 단가 * 수량
            const supplyAmount = unitPrice * quantity;
            setFormattedValue(getPageId(pagePrefix, `vatItemSupplyAmount${rowNum}`), supplyAmount);
            
            // 세액 = 공급가액 * 0.1 (1의 자리에서 반올림)
            const taxAmount = Math.round(supplyAmount * 0.1);
            setFormattedValue(getPageId(pagePrefix, `vatItemTaxAmount${rowNum}`), taxAmount);
        }
    }
    // 공급가액이 변경된 경우: 세액만 계산
    else if (trigger === 'supplyAmount') {
        const supplyAmount = parseNumber(supplyAmountElement.value);
        
        if (supplyAmount > 0) {
            // 세액 = 공급가액 * 0.1 (1의 자리에서 반올림)
            const taxAmount = Math.round(supplyAmount * 0.1);
            setFormattedValue(getPageId(pagePrefix, `vatItemTaxAmount${rowNum}`), taxAmount);
        }
    }
}

/**
 * 부가가치세 환급대상 품목 테이블 계산
 * @param {string} pagePrefix - 페이지 prefix
 * @param {boolean} recalculateRows - 각 행의 공급가액과 세액을 재계산할지 여부 (기본값: false)
 */
function calculateVatRefundItemsTable(pagePrefix, recalculateRows = false) {
    let totalTaxAmount = 0;
    
    // 테이블 body에서 모든 행 찾기
    const tableBody = document.getElementById(`${pagePrefix}-vatRefundItemsTableBody`);
    if (!tableBody) return 0;
    
    const rows = tableBody.querySelectorAll('tr');
    
    // 각 품목 행 계산
    rows.forEach((row, index) => {
        const rowNum = index + 1;
        
        // 재계산이 필요한 경우 (계산하기 버튼 클릭 시)
        if (recalculateRows) {
            calculateVatRefundItemRow(pagePrefix, rowNum, 'unitPriceOrQuantity');
        }
        
        // 세액 합산
        const taxAmountElement = row.querySelector(`input[id$="-vatItemTaxAmount${rowNum}"]`);
        if (taxAmountElement) {
            const taxAmount = parseNumber(taxAmountElement.value);
            totalTaxAmount += taxAmount;
        }
    });
    
    // 소계 계산 - 세액 항목의 모든 값의 합
    setFormattedValue(getPageId(pagePrefix, 'vatRefundSubtotal'), totalTaxAmount);
    
    return totalTaxAmount;
}

/**
 * 부가가치세 환급대상 품목 테이블에 행 추가
 * @param {string} pagePrefix - 페이지 prefix
 */
function addVatRefundItemRow(pagePrefix) {
    const tableBody = document.getElementById(`${pagePrefix}-vatRefundItemsTableBody`);
    if (!tableBody) return;
    
    // 현재 행 개수 확인
    const currentRows = tableBody.querySelectorAll('tr');
    const newRowNum = currentRows.length + 1;
    
    // 새 행 생성
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td class="align-center"><input type="text" id="${pagePrefix}-vatItemName${newRowNum}" placeholder="" class="vat-item-input vat-item-center"></td>
        <td class="align-center"><input type="text" id="${pagePrefix}-vatItemSpec${newRowNum}" placeholder="" class="vat-item-input vat-item-center"></td>
        <td><input type="text" id="${pagePrefix}-vatItemUnitPrice${newRowNum}" class="currency-input vat-item-input" placeholder="0"></td>
        <td><input type="text" id="${pagePrefix}-vatItemQuantity${newRowNum}" class="currency-input vat-item-input" placeholder="0"></td>
        <td><input type="text" id="${pagePrefix}-vatItemSupplyAmount${newRowNum}" class="currency-input vat-item-input" placeholder="0"></td>
        <td><input type="text" id="${pagePrefix}-vatItemTaxAmount${newRowNum}" class="currency-input vat-item-tax-input" placeholder="0"></td>
    `;
    
    // 테이블에 행 추가
    tableBody.appendChild(newRow);
    
    // 새 행의 입력 필드에 이벤트 리스너 연결
    attachVatItemRowEventListeners(pagePrefix, newRowNum);
    
    // 행삭제 버튼 상태 업데이트
    updateVatDeleteRowButtonState(pagePrefix);
    
    // 계산 수행
    performAllCalculations(pagePrefix);
}

/**
 * 부가가치세 환급대상 품목 테이블에서 행 삭제
 * @param {string} pagePrefix - 페이지 prefix
 */
function deleteVatRefundItemRow(pagePrefix) {
    const tableBody = document.getElementById(`${pagePrefix}-vatRefundItemsTableBody`);
    if (!tableBody) return;
    
    // 현재 행 개수 확인
    const currentRows = tableBody.querySelectorAll('tr');
    
    // 최소 1행은 유지
    if (currentRows.length <= 1) {
        alert('최소 1개의 행이 필요합니다.');
        return;
    }
    
    // 마지막 행 삭제
    const lastRow = currentRows[currentRows.length - 1];
    lastRow.remove();
    
    // 행삭제 버튼 상태 업데이트
    updateVatDeleteRowButtonState(pagePrefix);
    
    // 계산 수행
    performAllCalculations(pagePrefix);
}

/**
 * 행삭제 버튼 활성화/비활성화 상태 업데이트
 * @param {string} pagePrefix - 페이지 prefix
 */
function updateVatDeleteRowButtonState(pagePrefix) {
    const tableBody = document.getElementById(`${pagePrefix}-vatRefundItemsTableBody`);
    if (!tableBody) return;
    
    const currentRows = tableBody.querySelectorAll('tr');
    const deleteBtn = document.querySelector(`.vat-delete-row-btn[data-page="${pagePrefix.replace('page', '')}"]`);
    
    if (deleteBtn) {
        // 행이 1개 이하면 비활성화
        if (currentRows.length <= 1) {
            deleteBtn.disabled = true;
        } else {
            deleteBtn.disabled = false;
        }
    }
}

/**
 * 모든 계산 수행 (특정 페이지)
 * @param {string} pagePrefix - 페이지 prefix
 * @param {boolean} recalculateVatRows - 부가가치세 환급대상 품목 테이블의 각 행을 재계산할지 여부 (기본값: false)
 */
function performAllCalculations(pagePrefix, recalculateVatRows = false) {
    // 1. 보조금 테이블 계산
    calculateSubsidyTable(pagePrefix);
    
    // 2. 교부결정액 자동 계산 (보조금 소계)
    calculatePaymentDecision(pagePrefix);
    
    // 3. 사업비 산출금액 계산
    calculateProjectCost(pagePrefix);
    
    // 4. 자부담 테이블 계산 (사업비 산출금액 필요)
    calculateSelfContributionTable(pagePrefix);
    
    // 5. 부가가치세 환급대상 품목 테이블 계산
    calculateVatRefundItemsTable(pagePrefix, recalculateVatRows);
    
    // 원단위 경고 표시 업데이트
    updateUnitWarnings(pagePrefix);
    
    // 일원자리 경고 표시 업데이트
    updateOneWonUnitWarnings(pagePrefix);
}

// 검증 함수 (페이지 prefix 지원)

/**
 * 일원자리(1원 자리) 검증 함수
 */
function hasOneWonUnit(amount) {
    const n = Math.abs(parseInt(amount, 10) || 0);
    return n % 10 !== 0;
}

/**
 * 보조금 일원자리 검증
 * @param {string} pagePrefix - 페이지 prefix
 */
function validateOneWonUnitForSubsidy(pagePrefix) {
    const national = parseNumber(document.getElementById(getPageId(pagePrefix, 'nationalAmount')).value);
    const provincial = parseNumber(document.getElementById(getPageId(pagePrefix, 'provincialAmount')).value);
    const city = parseNumber(document.getElementById(getPageId(pagePrefix, 'cityAmount')).value);

    if (hasOneWonUnit(national) || hasOneWonUnit(provincial) || hasOneWonUnit(city)) {
        alert("보조금액 사업비의 일의 자리에 숫자가 존재하니 확인 바랍니다.");
        return false;
    }
    return true;
}

/**
 * 모든 검증 항목 확인 (특정 페이지)
 * @param {string} pagePrefix - 페이지 prefix
 */
function validateAll(pagePrefix) {
    if (!validateOneWonUnitForSubsidy(pagePrefix)) return false;
    
    // V01: 보조금+자부담 합계 검증
    const subsidySum = parseNumber(document.getElementById(getPageId(pagePrefix, 'subsidyTotal')).value);
    const selfContributionSum = parseNumber(document.getElementById(getPageId(pagePrefix, 'selfContributionTotal')).value);
    const totalCost = parseNumber(document.getElementById(getPageId(pagePrefix, 'totalCost')).value);
    
    if (Math.abs((subsidySum + selfContributionSum) - totalCost) > 1) {
        alert('보조금과 자부담의 합이 총사업비와 일치하지 않습니다.');
        return false;
    }
    
    // V02: 비율 100% 초과 검증
    const nationalRatio = parseNumber(document.getElementById(getPageId(pagePrefix, 'nationalRatio')).value);
    const provincialRatio = parseNumber(document.getElementById(getPageId(pagePrefix, 'provincialRatio')).value);
    const cityRatio = parseNumber(document.getElementById(getPageId(pagePrefix, 'cityRatio')).value);
    const matchingRatio = parseNumber(document.getElementById(getPageId(pagePrefix, 'matchingRatio')).value);
    
    if (nationalRatio > 100 || provincialRatio > 100 || cityRatio > 100 || matchingRatio > 100) {
        alert('비율이 100%를 초과하는 값이 있습니다.');
        return false;
    }
    
    // V03: 재원비율 소계 + 자부담율 (보조금매칭) = 100% 검증
    const totalRatio = parseNumber(document.getElementById(getPageId(pagePrefix, 'totalRatio')).value);
    const ratioSum = totalRatio + matchingRatio;
    
    if (Math.abs(ratioSum - 100) > 0.01) { // 0.01% 오차 허용
        alert('사업비율을 확인바랍니다');
        return false;
    }
    
    // V05: 음수 값 검증
    const pageElement = document.querySelector(`.page[data-page="${pagePrefix.replace('page', '')}"]`);
    if (pageElement) {
        const allInputs = pageElement.querySelectorAll('input[type="text"]:not(.readonly)');
        for (const input of allInputs) {
            const value = parseNumber(input.value);
            if (value < 0) {
                alert('음수 값이 존재합니다.');
                return false;
            }
        }
    }
    
    alert('검증 완료: 모든 항목이 정상입니다.');
    return true;
}

/**
 * 원단위 값이 0이 아닌 경우 해당 항목을 빨간색으로 표시
 * @param {string} pagePrefix - 페이지 prefix
 */
function updateUnitWarnings(pagePrefix) {
    const ids = [
        "totalCost",
        "paymentDecision",
        "projectCost",
        "subsidyTotal",
        "nationalAmount",
        "provincialAmount",
        "cityAmount"
    ];

    ids.forEach(id => {
        const el = document.getElementById(getPageId(pagePrefix, id));
        if (!el) return;

        const val = parseNumber(el.value);
        if (val !== 0) el.classList.add("unit-warning");
        else el.classList.remove("unit-warning");
    });
}

/**
 * 일원자리 값이 존재하면 해당 항목을 빨간색으로 표시
 * @param {string} pagePrefix - 페이지 prefix
 */
function updateOneWonUnitWarnings(pagePrefix) {
    const ids = [
        "totalCost",
        "paymentDecision",
        "projectCost",
        "subsidyTotal",
        "nationalAmount",
        "provincialAmount",
        "cityAmount"
    ];

    ids.forEach(id => {
        const el = document.getElementById(getPageId(pagePrefix, id));
        if (!el) return;

        const val = parseNumber(el.value);

        if (hasOneWonUnit(val)) {
            el.classList.add("unit-warning");
        } else {
            el.classList.remove("unit-warning");
        }
    });
}

// 커스텀 Alert 모달 함수
function customAlert(msg) {
    const overlay = document.getElementById("customAlertOverlay");
    overlay.querySelector(".alert-message").textContent = msg;
    overlay.classList.remove("hidden");
    overlay.querySelector(".alert-close-btn").onclick = () => {
        overlay.classList.add("hidden");
    };
}

// window.alert를 커스텀 모달로 오버라이드
window.alert = customAlert;

// 커스텀 Alert 모달 HTML 자동 삽입
(function createAlertModal() {
    const html = `
    <div id="customAlertOverlay" class="alert-overlay hidden">
        <div class="alert-box">
            <div class="alert-message"></div>
            <button class="alert-close-btn">확인</button>
        </div>
    </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
})();

// 페이지 관리 함수들

/**
 * 페이지 번호 재정렬 및 ID 업데이트
 */
function reorderPages() {
    const pages = document.querySelectorAll('.page');
    pages.forEach((page, index) => {
        const newPageNum = index + 1;
        const oldPageNum = page.getAttribute('data-page');
        const oldPrefix = `page${oldPageNum}`;
        const newPrefix = `page${newPageNum}`;
        
        // data-page 업데이트
        page.setAttribute('data-page', newPageNum);
        
        // 페이지 번호 텍스트 업데이트
        const pageNumberEl = page.querySelector('.page-number');
        if (pageNumberEl) {
            pageNumberEl.textContent = `페이지 ${newPageNum}`;
        }
        
        // 모든 버튼의 data-page 속성 업데이트
        const buttons = page.querySelectorAll('[data-page]');
        buttons.forEach(btn => {
            btn.setAttribute('data-page', newPageNum);
        });
        
        // 모든 input/select/textarea의 ID 업데이트
        if (oldPageNum !== String(newPageNum)) {
            const inputs = page.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.id && input.id.startsWith(oldPrefix + '-')) {
                    const newId = input.id.replace(oldPrefix + '-', newPrefix + '-');
                    input.id = newId;
                    
                    // label의 for 속성도 업데이트 (있는 경우)
                    const label = document.querySelector(`label[for="${oldPrefix}-${input.id.split('-').slice(1).join('-')}"]`);
                    if (label) {
                        label.setAttribute('for', newId);
                    }
                }
            });
            
            // 한글 금액 표시 span의 ID도 업데이트
            const koreanAmounts = page.querySelectorAll('.korean-amount');
            koreanAmounts.forEach(span => {
                if (span.id && span.id.startsWith(oldPrefix + '-')) {
                    span.id = span.id.replace(oldPrefix + '-', newPrefix + '-');
                }
            });
        }
    });
    
    // 삭제 버튼 활성화 상태 업데이트
    updateDeleteButtonsState();
}

/**
 * 삭제 버튼 활성화 상태 업데이트
 */
function updateDeleteButtonsState() {
    const pages = document.querySelectorAll('.page');
    const deleteButtons = document.querySelectorAll('.page-delete-btn');
    
    if (pages.length === 1) {
        deleteButtons.forEach(btn => {
            btn.disabled = true;
        });
    } else {
        deleteButtons.forEach(btn => {
            btn.disabled = false;
        });
    }
}

/**
 * 페이지 추가
 */
function addPage() {
    const pages = document.querySelectorAll('.page');
    if (pages.length >= 10) {
        alert('최대 10페이지까지 생성 가능합니다.');
        return;
    }
    
    const templatePage = pages[0];
    const newPageNum = pages.length + 1;
    const newPrefix = `page${newPageNum}`;
    
    // 템플릿 복제
    const newPage = templatePage.cloneNode(true);
    newPage.setAttribute('data-page', newPageNum);
    
    // 페이지 번호 업데이트
    const pageNumberEl = newPage.querySelector('.page-number');
    if (pageNumberEl) {
        pageNumberEl.textContent = `페이지 ${newPageNum}`;
    }
    
    // 모든 버튼의 data-page 속성 업데이트
    const buttons = newPage.querySelectorAll('[data-page]');
    buttons.forEach(btn => {
        btn.setAttribute('data-page', newPageNum);
    });
    
    // 모든 요소의 ID 업데이트 (input, select, textarea, table, tbody, span 등)
    const allElementsWithId = newPage.querySelectorAll('[id]');
    allElementsWithId.forEach(element => {
        if (element.id && element.id.startsWith('page1-')) {
            const newId = element.id.replace('page1-', newPrefix + '-');
            element.id = newId;
            
            // input, select, textarea의 경우 값 초기화
            if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
                if (element.type !== 'button' && element.type !== 'submit') {
                    element.value = ''; // 새 페이지는 빈 값으로 시작
                }
            }
            // span의 경우 텍스트 초기화
            else if (element.tagName === 'SPAN') {
                element.textContent = '';
            }
        }
    });
    
    // 복제된 페이지의 모든 data-listener-attached 속성 제거 (이벤트 리스너 재연결을 위해)
    // cloneNode는 이벤트 리스너를 복제하지 않지만, data 속성은 복제되므로 제거 필요
    const allElementsWithListener = newPage.querySelectorAll('[data-listener-attached]');
    allElementsWithListener.forEach(element => {
        element.removeAttribute('data-listener-attached');
    });
    
    // 페이지 컨테이너에 추가 (DOM에 추가한 후 이벤트 리스너 연결)
    document.getElementById('pages').appendChild(newPage);
    
    // 이벤트 리스너 연결 (DOM에 추가한 후)
    attachPageEventListeners(newPage, newPrefix);
    
    // 삭제 버튼 상태 업데이트
    updateDeleteButtonsState();
    
    // 초기 계산 수행
    performAllCalculations(newPrefix);
}

/**
 * 페이지 삭제
 * @param {number} pageNum - 삭제할 페이지 번호
 */
function deletePage(pageNum) {
    const pages = document.querySelectorAll('.page');
    if (pages.length === 1) {
        alert('최소 1개의 페이지가 필요합니다.');
        return;
    }
    
    if (confirm(`페이지 ${pageNum}을(를) 삭제하시겠습니까?`)) {
        const pageToDelete = document.querySelector(`.page[data-page="${pageNum}"]`);
        if (pageToDelete) {
            pageToDelete.remove();
            reorderPages();
        }
    }
}

/**
 * 페이지 초기화
 * @param {number} pageNum - 초기화할 페이지 번호
 */
function resetPage(pageNum) {
    const pagePrefix = `page${pageNum}`;
    const pageElement = document.querySelector(`.page[data-page="${pageNum}"]`);
    
    if (!pageElement) return;
    
    if (confirm(`페이지 ${pageNum}의 모든 입력값을 초기화하시겠습니까?`)) {
        // 모든 입력 필드 초기화
        const inputs = pageElement.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
            input.value = '';
        });
        
        // 모든 한글 금액 표기 초기화
        const koreanAmounts = pageElement.querySelectorAll('.korean-amount');
        koreanAmounts.forEach(element => {
            element.textContent = '';
        });
        
        // 초기 계산 수행
        performAllCalculations(pagePrefix);
    }
}

/**
 * 전체 초기화
 */
function resetAll() {
    if (confirm('모든 페이지의 입력값을 초기화하시겠습니까?')) {
        const pages = document.querySelectorAll('.page');
        pages.forEach((page, index) => {
            const pageNum = index + 1;
            const pagePrefix = `page${pageNum}`;
            
            // 모든 입력 필드 초기화
            const inputs = page.querySelectorAll('input[type="text"]');
            inputs.forEach(input => {
                input.value = '';
            });
            
            // 모든 한글 금액 표기 초기화
            const koreanAmounts = page.querySelectorAll('.korean-amount');
            koreanAmounts.forEach(element => {
                element.textContent = '';
            });
            
            // 초기 계산 수행
            performAllCalculations(pagePrefix);
        });
    }
}

/**
 * 특정 페이지의 이벤트 리스너 연결
 * @param {HTMLElement} pageElement - 페이지 요소
 * @param {string} pagePrefix - 페이지 prefix
 */
function attachPageEventListeners(pageElement, pagePrefix) {
    const pageNum = pagePrefix.replace('page', '');
    
    // 총 사업비 입력 처리
    const totalCostInput = pageElement.querySelector(`#${getPageId(pagePrefix, 'totalCost')}`);
    if (totalCostInput) {
        totalCostInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^0-9]/g, '');
            if (value) {
                const numValue = parseNumber(value);
                setFormattedValue(getPageId(pagePrefix, 'totalCost'), numValue, false, true);
                performAllCalculations(pagePrefix);
            } else {
                e.target.value = '';
                updateKoreanAmount(getPageId(pagePrefix, 'totalCost'), 0);
            }
        });
        
        const formatTotalCost = function() {
            const value = parseNumber(totalCostInput.value);
            setFormattedValue(getPageId(pagePrefix, 'totalCost'), value, false, true);
        };
        
        totalCostInput.addEventListener('blur', formatTotalCost);
        totalCostInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                formatTotalCost();
                this.blur();
            }
        });
    }
    
    // 보조금 테이블 입력 필드 이벤트 (재원비율만 직접입력 가능)
    const subsidyRatioInputs = [
        'nationalRatio',
        'provincialRatio',
        'cityRatio'
    ];
    
    subsidyRatioInputs.forEach(id => {
        const element = pageElement.querySelector(`#${getPageId(pagePrefix, id)}`);
        if (element) {
            element.addEventListener('input', function(e) {
                let value = e.target.value.replace(/[^0-9.%]/g, '');
                const percentCount = (value.match(/%/g) || []).length;
                if (percentCount > 1) {
                    value = value.replace(/%/g, '') + '%';
                }
                e.target.value = value;
                performAllCalculations(pagePrefix);
            });
            
            const formatPercent = function() {
                const value = element.value.trim();
                if (value && !value.includes('%')) {
                    const numValue = parseNumber(value);
                    if (!isNaN(numValue) && numValue !== 0) {
                        element.value = formatNumber(numValue) + '%';
                    }
                } else if (value && value.includes('%')) {
                    const numValue = parseNumber(value);
                    if (!isNaN(numValue) && numValue !== 0) {
                        element.value = formatNumber(numValue) + '%';
                    }
                }
            };
            
            element.addEventListener('blur', formatPercent);
            element.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    formatPercent();
                    this.blur();
                }
            });
        }
    });
    
    // 자부담 테이블 입력 필드 이벤트
    const matchingRatioElement = pageElement.querySelector(`#${getPageId(pagePrefix, 'matchingRatio')}`);
    if (matchingRatioElement) {
        matchingRatioElement.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^0-9.%]/g, '');
            const percentCount = (value.match(/%/g) || []).length;
            if (percentCount > 1) {
                value = value.replace(/%/g, '') + '%';
            }
            e.target.value = value;
            performAllCalculations(pagePrefix);
        });
        
        const formatMatchingRatio = function() {
            const value = matchingRatioElement.value.trim();
            if (value && !value.includes('%')) {
                const numValue = parseNumber(value);
                if (!isNaN(numValue) && numValue !== 0) {
                    matchingRatioElement.value = formatNumber(numValue) + '%';
                }
            } else if (value && value.includes('%')) {
                const numValue = parseNumber(value);
                if (!isNaN(numValue) && numValue !== 0) {
                    matchingRatioElement.value = formatNumber(numValue) + '%';
                }
            }
        };
        
        matchingRatioElement.addEventListener('blur', formatMatchingRatio);
        matchingRatioElement.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                formatMatchingRatio();
                this.blur();
            }
        });
    }
    
    // 부가가치세 환급액, 기타부담금 이벤트
    const selfContributionInputs = ['vatRefund', 'otherExpenses'];
    selfContributionInputs.forEach(id => {
        const element = pageElement.querySelector(`#${getPageId(pagePrefix, id)}`);
        if (element) {
            element.addEventListener('input', function(e) {
                let value = e.target.value.replace(/[^0-9]/g, '');
                if (value) {
                    e.target.value = value;
                } else {
                    e.target.value = '';
                }
                performAllCalculations(pagePrefix);
            });
            
            const formatCurrency = function() {
                const value = parseNumber(element.value);
                element.value = formatNumber(value);
            };
            
            element.addEventListener('blur', formatCurrency);
            element.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    formatCurrency();
                    this.blur();
                }
            });
        }
    });
    
    // 부가가치세 환급대상 품목 테이블 입력 필드 이벤트
    // 기존 행들에 이벤트 리스너 연결
    const tableBody = pageElement.querySelector(`#${pagePrefix}-vatRefundItemsTableBody`);
    if (tableBody) {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            attachVatItemRowEventListeners(pagePrefix, index + 1);
        });
    }
    
    // 행추가 버튼 이벤트 (data-page 속성으로 필터링)
    const addRowBtn = pageElement.querySelector(`.vat-add-row-btn[data-page="${pageNum}"]`);
    if (addRowBtn && !addRowBtn.hasAttribute('data-listener-attached')) {
        addRowBtn.setAttribute('data-listener-attached', 'true');
        addRowBtn.addEventListener('click', function() {
            addVatRefundItemRow(pagePrefix);
        });
    }
    
    // 행삭제 버튼 이벤트 (data-page 속성으로 필터링)
    const deleteRowBtn = pageElement.querySelector(`.vat-delete-row-btn[data-page="${pageNum}"]`);
    if (deleteRowBtn && !deleteRowBtn.hasAttribute('data-listener-attached')) {
        deleteRowBtn.setAttribute('data-listener-attached', 'true');
        deleteRowBtn.addEventListener('click', function() {
            deleteVatRefundItemRow(pagePrefix);
        });
    }
    
    // 초기 행삭제 버튼 상태 업데이트
    updateVatDeleteRowButtonState(pagePrefix);
    
    // 계산하기 버튼 이벤트
    const calculateBtn = pageElement.querySelector('.calculateBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            // 부가가치세 환급대상 품목 테이블의 각 행을 재계산
            performAllCalculations(pagePrefix, true);
            alert('계산이 완료되었습니다.');
        });
    }
    
    // 검증하기 버튼 이벤트
    const validateBtn = pageElement.querySelector('.validateBtn');
    if (validateBtn) {
        validateBtn.addEventListener('click', function() {
            validateAll(pagePrefix);
        });
    }
}

/**
 * 부가가치세 환급대상 품목 테이블 행의 입력 필드에 이벤트 리스너 연결
 * @param {string} pagePrefix - 페이지 prefix
 * @param {number} rowNum - 행 번호
 */
function attachVatItemRowEventListeners(pagePrefix, rowNum) {
    // 페이지 요소 찾기
    const pageElement = document.querySelector(`.page[data-page="${pagePrefix.replace('page', '')}"]`);
    if (!pageElement) return;
    
    // 기존 이벤트 리스너가 있을 수 있으므로 새 요소로 교체하거나 확인 필요
    // 단가 입력 필드
    const unitPriceElement = pageElement.querySelector(`#${getPageId(pagePrefix, `vatItemUnitPrice${rowNum}`)}`);
    if (unitPriceElement && !unitPriceElement.hasAttribute('data-listener-attached')) {
        unitPriceElement.setAttribute('data-listener-attached', 'true');
        unitPriceElement.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^0-9]/g, '');
            if (value) {
                e.target.value = value;
            } else {
                e.target.value = '';
            }
            // 단가 변경 시 해당 행의 공급가액과 세액 자동 계산
            calculateVatRefundItemRow(pagePrefix, rowNum, 'unitPriceOrQuantity');
            // 소계 재계산
            calculateVatRefundItemsTable(pagePrefix);
        });
        
        const formatUnitPrice = function() {
            const value = parseNumber(unitPriceElement.value);
            unitPriceElement.value = formatNumber(value);
            // 포맷팅 후 재계산
            calculateVatRefundItemRow(pagePrefix, rowNum, 'unitPriceOrQuantity');
            calculateVatRefundItemsTable(pagePrefix);
        };
        
        unitPriceElement.addEventListener('blur', formatUnitPrice);
        unitPriceElement.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                formatUnitPrice();
                this.blur();
            }
        });
    }
    
    // 수량 입력 필드
    const quantityElement = pageElement.querySelector(`#${getPageId(pagePrefix, `vatItemQuantity${rowNum}`)}`);
    if (quantityElement && !quantityElement.hasAttribute('data-listener-attached')) {
        quantityElement.setAttribute('data-listener-attached', 'true');
        quantityElement.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^0-9]/g, '');
            if (value) {
                e.target.value = value;
            } else {
                e.target.value = '';
            }
            // 수량 변경 시 해당 행의 공급가액과 세액 자동 계산
            calculateVatRefundItemRow(pagePrefix, rowNum, 'unitPriceOrQuantity');
            // 소계 재계산
            calculateVatRefundItemsTable(pagePrefix);
        });
        
        const formatQuantity = function() {
            const value = parseNumber(quantityElement.value);
            quantityElement.value = formatNumber(value);
            // 포맷팅 후 재계산
            calculateVatRefundItemRow(pagePrefix, rowNum, 'unitPriceOrQuantity');
            calculateVatRefundItemsTable(pagePrefix);
        };
        
        quantityElement.addEventListener('blur', formatQuantity);
        quantityElement.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                formatQuantity();
                this.blur();
            }
        });
    }
    
    // 공급가액 입력 필드
    const supplyAmountElement = pageElement.querySelector(`#${getPageId(pagePrefix, `vatItemSupplyAmount${rowNum}`)}`);
    if (supplyAmountElement && !supplyAmountElement.hasAttribute('data-listener-attached')) {
        supplyAmountElement.setAttribute('data-listener-attached', 'true');
        supplyAmountElement.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^0-9]/g, '');
            if (value) {
                e.target.value = value;
            } else {
                e.target.value = '';
            }
            // 공급가액 변경 시 해당 행의 세액 자동 계산
            calculateVatRefundItemRow(pagePrefix, rowNum, 'supplyAmount');
            // 소계 재계산
            calculateVatRefundItemsTable(pagePrefix);
        });
        
        const formatSupplyAmount = function() {
            const value = parseNumber(supplyAmountElement.value);
            supplyAmountElement.value = formatNumber(value);
            // 포맷팅 후 재계산 (공급가액 변경 시 세액 계산)
            calculateVatRefundItemRow(pagePrefix, rowNum, 'supplyAmount');
            calculateVatRefundItemsTable(pagePrefix);
        };
        
        supplyAmountElement.addEventListener('blur', formatSupplyAmount);
        supplyAmountElement.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                formatSupplyAmount();
                this.blur();
            }
        });
    }
    
    // 세액 입력 필드
    const taxAmountElement = pageElement.querySelector(`#${getPageId(pagePrefix, `vatItemTaxAmount${rowNum}`)}`);
    if (taxAmountElement && !taxAmountElement.hasAttribute('data-listener-attached')) {
        taxAmountElement.setAttribute('data-listener-attached', 'true');
        taxAmountElement.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^0-9]/g, '');
            if (value) {
                e.target.value = value;
            } else {
                e.target.value = '';
            }
            // 세액 변경 시 소계만 재계산 (사용자가 직접 수정한 경우)
            calculateVatRefundItemsTable(pagePrefix);
        });
        
        const formatTaxAmount = function() {
            const value = parseNumber(taxAmountElement.value);
            taxAmountElement.value = formatNumber(value);
            // 포맷팅 후 소계 재계산
            calculateVatRefundItemsTable(pagePrefix);
        };
        
        taxAmountElement.addEventListener('blur', formatTaxAmount);
        taxAmountElement.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                formatTaxAmount();
                this.blur();
            }
        });
    }
}

// PDF 출력 함수들

/**
 * PDF를 "다른 이름으로 저장" 대화상자와 함께 저장
 * @param {jsPDF} pdf - jsPDF 인스턴스
 * @param {string} filename - 기본 파일명
 */
async function savePdfWithDialog(pdf, filename) {
    try {
        // PDF를 Blob으로 변환
        const blob = pdf.output('blob');
        
        // File System Access API 지원 확인 (Chrome 86+, Edge 86+)
        if ('showSaveFilePicker' in window) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'PDF 파일',
                        accept: { 'application/pdf': ['.pdf'] }
                    }]
                });
                
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                return;
            } catch (error) {
                // 사용자가 대화상자를 취소한 경우
                if (error.name === 'AbortError') {
                    return;
                }
                // 다른 오류가 발생한 경우 폴백 사용
                console.warn('File System Access API 오류:', error);
            }
        }
        
        // 폴백: Blob URL을 사용하여 다운로드 (download 속성 없이)
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // download 속성을 제거하여 브라우저의 기본 "다른 이름으로 저장" 동작 사용
        // 브라우저 설정에 따라 다운로드 폴더에 저장되거나 대화상자가 열릴 수 있음
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Blob URL 정리 (약간의 지연 후)
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    } catch (error) {
        console.error('PDF 저장 중 오류 발생:', error);
        throw error;
    }
}

/**
 * 개별 페이지 PDF 출력
 * @param {number} pageNum - 출력할 페이지 번호
 */
async function exportPageToPdf(pageNum) {
    try {
        const pagePrefix = `page${pageNum}`;
        const pageElement = document.querySelector(`.page[data-page="${pageNum}"]`);
        
        if (!pageElement) {
            alert('페이지를 찾을 수 없습니다.');
            return;
        }
        
        // 계산 수행
        performAllCalculations(pagePrefix);
        
        // PDF 출력 전용 모드 활성화
        document.body.classList.add('print-mode');
        
        // A4 크기 설정
        const pageWidth = 210; // mm
        const pageHeight = 297; // mm
        const margin = 15; // mm
        const usableWidth = pageWidth - (margin * 2); // 180mm
        const usableHeight = pageHeight - (margin * 2); // 267mm
        
        // html2canvas로 캡처
        const canvas = await html2canvas(pageElement, {
            useCORS: true,
            scale: window.devicePixelRatio * 2,
            backgroundColor: null,
            logging: false,
            allowTaint: false
        });
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        // 이미지 스케일 계산
        const mmToPx = 3.7795275590551;
        const usableWidthPx = usableWidth * mmToPx;
        const widthScale = usableWidthPx / imgWidth;
        const scaledWidthPx = usableWidthPx;
        const scaledHeightPx = imgHeight * widthScale;
        const scaledWidthMm = scaledWidthPx / mmToPx;
        const scaledHeightMm = scaledHeightPx / mmToPx;
        
        // jsPDF 인스턴스 생성
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // 여러 페이지 지원
        let yPosition = margin;
        let remainingHeightMm = scaledHeightMm;
        let sourceY = 0;
        
        while (remainingHeightMm > 0) {
            const availableHeightMm = usableHeight;
            const heightToAddMm = Math.min(remainingHeightMm, availableHeightMm);
            const sourceHeightPx = (heightToAddMm / scaledHeightMm) * imgHeight;
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = imgWidth;
            tempCanvas.height = Math.ceil(sourceHeightPx);
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCtx.drawImage(
                canvas,
                0, sourceY, imgWidth, sourceHeightPx,
                0, 0, imgWidth, sourceHeightPx
            );
            
            const tempImgData = tempCanvas.toDataURL('image/png');
            pdf.addImage(tempImgData, 'PNG', margin, yPosition, scaledWidthMm, heightToAddMm);
            
            remainingHeightMm -= heightToAddMm;
            sourceY += sourceHeightPx;
            
            if (remainingHeightMm > 0) {
                pdf.addPage();
                yPosition = margin;
            }
        }
        
        const filename = buildPdfFileName(pagePrefix, false);
        await savePdfWithDialog(pdf, filename);
        
        // PDF 출력 전용 모드 비활성화
        document.body.classList.remove('print-mode');
        
    } catch (error) {
        console.error('PDF 생성 중 오류 발생:', error);
        alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
        document.body.classList.remove('print-mode');
    }
}

/**
 * 전체 페이지 PDF 출력
 */
async function exportAllPagesToPdf() {
    try {
        const pages = document.querySelectorAll('.page');
        
        if (pages.length === 0) {
            alert('출력할 페이지가 없습니다.');
            return;
        }
        
        // 모든 페이지 계산 수행
        pages.forEach((page, index) => {
            const pageNum = index + 1;
            const pagePrefix = `page${pageNum}`;
            performAllCalculations(pagePrefix);
        });
        
        // PDF 출력 전용 모드 활성화
        document.body.classList.add('print-mode');
        
        // A4 크기 설정
        const pageWidth = 210; // mm
        const pageHeight = 297; // mm
        const margin = 15; // mm
        const usableWidth = pageWidth - (margin * 2); // 180mm
        const usableHeight = pageHeight - (margin * 2); // 267mm
        
        // jsPDF 인스턴스 생성
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const mmToPx = 3.7795275590551;
        const usableWidthPx = usableWidth * mmToPx;
        
        // 각 페이지를 순서대로 처리
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const pageNum = i + 1;
            
            // html2canvas로 캡처
            const canvas = await html2canvas(page, {
                useCORS: true,
                scale: window.devicePixelRatio * 2,
                backgroundColor: null,
                logging: false,
                allowTaint: false
            });
            
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            
            // 이미지 스케일 계산
            const widthScale = usableWidthPx / imgWidth;
            const scaledWidthPx = usableWidthPx;
            const scaledHeightPx = imgHeight * widthScale;
            const scaledWidthMm = scaledWidthPx / mmToPx;
            const scaledHeightMm = scaledHeightPx / mmToPx;
            
            // 여러 페이지 지원
            let yPosition = margin;
            let remainingHeightMm = scaledHeightMm;
            let sourceY = 0;
            
            while (remainingHeightMm > 0) {
                const availableHeightMm = usableHeight;
                const heightToAddMm = Math.min(remainingHeightMm, availableHeightMm);
                const sourceHeightPx = (heightToAddMm / scaledHeightMm) * imgHeight;
                
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = imgWidth;
                tempCanvas.height = Math.ceil(sourceHeightPx);
                const tempCtx = tempCanvas.getContext('2d');
                
                tempCtx.drawImage(
                    canvas,
                    0, sourceY, imgWidth, sourceHeightPx,
                    0, 0, imgWidth, sourceHeightPx
                );
                
                const tempImgData = tempCanvas.toDataURL('image/png');
                pdf.addImage(tempImgData, 'PNG', margin, yPosition, scaledWidthMm, heightToAddMm);
                
                remainingHeightMm -= heightToAddMm;
                sourceY += sourceHeightPx;
                
                if (remainingHeightMm > 0) {
                    pdf.addPage();
                    yPosition = margin;
                }
            }
            
            // 마지막 페이지가 아니면 새 페이지 추가
            if (i < pages.length - 1) {
                pdf.addPage();
            }
        }
        
        // 전체 PDF 파일명: 첫 페이지 보조사업자명을 사용
        const filename = buildPdfFileName('page1', true);
        await savePdfWithDialog(pdf, filename);
        
        // PDF 출력 전용 모드 비활성화
        document.body.classList.remove('print-mode');
        
    } catch (error) {
        console.error('PDF 생성 중 오류 발생:', error);
        alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
        document.body.classList.remove('print-mode');
    }
}

// 테마 토글 관련 상수 및 함수
const THEME_STORAGE_KEY = 'jh-theme-mode';

function applyTheme(mode) {
    const body = document.body;
    if (mode === 'light') {
        body.setAttribute('data-theme', 'light');
    } else {
        // 기본은 다크 모드
        body.removeAttribute('data-theme');
        mode = 'dark';
    }

    const toggleInput = document.getElementById('themeToggle');
    const toggleLabel = document.querySelector('.theme-toggle-label');
    if (toggleInput) {
        toggleInput.checked = (mode === 'light');
    }
    if (toggleLabel) {
        toggleLabel.textContent = mode === 'light' ? '라이트 모드' : '다크 모드';
    }
}

function initTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialMode = saved || (prefersDark ? 'dark' : 'dark'); // 기존 디자인 유지: 기본 다크

    applyTheme(initialMode);

    const toggleInput = document.getElementById('themeToggle');
    if (toggleInput) {
        toggleInput.addEventListener('change', () => {
            const next = toggleInput.checked ? 'light' : 'dark';
            applyTheme(next);
            localStorage.setItem(THEME_STORAGE_KEY, next);
        });
    }
}

// DOMContentLoaded 이벤트
document.addEventListener('DOMContentLoaded', function() {
    // 테마 초기화
    initTheme();

    // 첫 번째 페이지 이벤트 리스너 연결
    const firstPage = document.querySelector('.page[data-page="1"]');
    if (firstPage) {
        attachPageEventListeners(firstPage, 'page1');
    }
    
    // 삭제 버튼 상태 초기화
    updateDeleteButtonsState();
    
    // 페이지 추가 버튼
    document.getElementById('addPageBtn').addEventListener('click', addPage);
    
    // 전체 초기화 버튼
    document.getElementById('resetAllBtn').addEventListener('click', resetAll);
    
    // 전체 PDF 출력 버튼
    document.getElementById('exportAllPdfBtn').addEventListener('click', exportAllPagesToPdf);
    
    // 페이지 삭제 버튼들 (이벤트 위임)
    document.getElementById('pages').addEventListener('click', function(e) {
        if (e.target.classList.contains('page-delete-btn')) {
            const pageNum = parseInt(e.target.getAttribute('data-page'));
            deletePage(pageNum);
        }
    });
    
    // 페이지 초기화 버튼들 (이벤트 위임)
    document.getElementById('pages').addEventListener('click', function(e) {
        if (e.target.classList.contains('page-reset-btn')) {
            const pageNum = parseInt(e.target.getAttribute('data-page'));
            resetPage(pageNum);
        }
    });
    
    // 개별 페이지 PDF 출력 버튼들 (이벤트 위임)
    document.getElementById('pages').addEventListener('click', function(e) {
        if (e.target.classList.contains('page-pdf-btn')) {
            const pageNum = parseInt(e.target.getAttribute('data-page'));
            exportPageToPdf(pageNum);
        }
    });
    
    // 초기 계산 수행
    performAllCalculations('page1');
});
