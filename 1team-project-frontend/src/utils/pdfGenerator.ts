import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';

export interface PDFReportData {
  city?: string;
  district?: string;
  dong?: string;
  businessType?: string;
  rent?: string;
  score?: string;
}

export interface SimplePDFData {
  businessType: string;
  rent: number;
  city: string;
  district: string;
  lat: number;
  lng: number;
}

export interface WizardPDFData {
  businessType: string;
  monthlyRent: number;
  deposit: number;
  area: number;
  district: string;
  city?: string;
  topDongData: {
    동?: string;
    dong?: string;
    점수?: number;
    score?: number;
    매출?: number;
    점포수?: number;
    정규화매출효율?: number;
    정규화성장률?: number;
    정규화경쟁밀도?: number;
  };
}

/**
 * CSS 색상을 RGB로 변환하는 함수
 * oklch(), lab(), lch() 등의 최신 색상 함수를 RGB로 변환
 */
function convertColorToRGB(color: string): string {
  if (!color || color === 'transparent' || color === 'none') {
    return color;
  }

  // 이미 RGB 형식이면 그대로 반환
  if (color.startsWith('rgb(') || color.startsWith('rgba(') || color.startsWith('#')) {
    return color;
  }

  try {
    // 임시 요소를 생성하여 색상을 RGB로 변환
    const tempDiv = document.createElement('div');
    tempDiv.style.color = color;
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);
    
    const computedStyle = window.getComputedStyle(tempDiv);
    const rgbColor = computedStyle.color;
    
    document.body.removeChild(tempDiv);
    return rgbColor;
  } catch (error) {
    console.warn('색상 변환 실패:', color, error);
    return '#000000'; // 기본값으로 검은색 반환
  }
}

/**
 * 요소의 모든 자식 요소를 순회하며 색상을 RGB로 변환
 * computed style을 인라인 스타일로 적용하여 CSS 변수와 oklch() 색상을 RGB로 변환
 */
function convertElementColorsToRGB(element: HTMLElement): void {
  // 모든 요소를 가져옴 (자기 자신 포함)
  const allElements = [element, ...Array.from(element.querySelectorAll('*'))] as HTMLElement[];
  
  allElements.forEach((el) => {
    try {
      const style = window.getComputedStyle(el);
      
      // 주요 색상 속성들을 RGB로 변환하여 인라인 스타일로 적용
      const colorProperties = [
        'color',
        'backgroundColor',
        'borderColor',
        'borderTopColor',
        'borderRightColor',
        'borderBottomColor',
        'borderLeftColor',
        'outlineColor',
        'fill',
        'stroke',
      ];
      
      colorProperties.forEach((prop) => {
        try {
          const computedColor = style.getPropertyValue(prop);
          if (computedColor && computedColor !== 'rgba(0, 0, 0, 0)' && computedColor !== 'transparent' && computedColor !== 'none') {
            // computed style은 브라우저가 계산한 RGB 값이므로 직접 사용
            el.style.setProperty(prop, computedColor, 'important');
          }
        } catch (e) {
          // 개별 속성 변환 실패 시 무시
        }
      });
      
      // 테두리 스타일도 복사 (색상 외에도)
      try {
        const borderWidth = style.borderWidth;
        const borderStyle = style.borderStyle;
        if (borderWidth && borderWidth !== '0px') {
          el.style.borderWidth = borderWidth;
          if (borderStyle) {
            el.style.borderStyle = borderStyle;
          }
        }
      } catch (e) {
        // 무시
      }
    } catch (e) {
      // 요소 스타일 변환 실패 시 무시
    }
  });
}

/**
 * CSS 변수를 RGB 값으로 변환하는 헬퍼 함수
 */
function getCSSVariableValue(variableName: string, element: HTMLElement): string | null {
  const style = window.getComputedStyle(element);
  const value = style.getPropertyValue(variableName).trim();
  
  if (!value) return null;
  
  // oklch() 함수가 포함된 경우 computed style을 통해 RGB로 변환
  if (value.includes('oklch') || value.includes('lab') || value.includes('lch')) {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.style.backgroundColor = value;
      tempDiv.style.position = 'absolute';
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.top = '-9999px';
      document.body.appendChild(tempDiv);
      
      const computed = window.getComputedStyle(tempDiv);
      const rgb = computed.backgroundColor;
      
      document.body.removeChild(tempDiv);
      return rgb;
    } catch (e) {
      return null;
    }
  }
  
  return value;
}

/**
 * 모든 CSS 속성을 인라인 스타일로 적용하는 함수
 */
function applyAllComputedStyles(element: HTMLElement): void {
  const allElements = [element, ...Array.from(element.querySelectorAll('*'))] as HTMLElement[];
  
  allElements.forEach((el) => {
    try {
      const computedStyle = window.getComputedStyle(el);
      
      // CSS의 모든 속성을 가져와서 인라인 스타일로 적용
      // getPropertyValue를 사용하여 모든 CSS 속성 가져오기
      const allProperties: { [key: string]: string } = {};
      
      // 주요 CSS 속성 목록 (가능한 많은 속성 적용)
      const cssProperties = [
        // 레이아웃
        'display', 'position', 'top', 'right', 'bottom', 'left',
        'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
        'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
        'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        'boxSizing', 'overflow', 'overflowX', 'overflowY',
        
        // 플렉스/그리드
        'flex', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'alignContent',
        'grid', 'gridTemplateColumns', 'gridTemplateRows', 'gridGap',
        
        // 색상 및 배경
        'color', 'backgroundColor', 'background', 'backgroundImage', 'backgroundSize',
        'border', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
        'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
        'borderWidth', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
        'borderStyle', 'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle',
        'borderRadius', 'outline', 'outlineColor',
        
        // 텍스트
        'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'lineHeight',
        'textAlign', 'textDecoration', 'textTransform', 'letterSpacing', 'wordSpacing',
        
        // 기타
        'opacity', 'visibility', 'zIndex', 'transform', 'transition',
        'boxShadow', 'textShadow',
      ];
      
      // 모든 속성을 computed value로 가져와서 인라인으로 적용
      cssProperties.forEach((prop) => {
        try {
          const value = computedStyle.getPropertyValue(prop) || (computedStyle as any)[prop];
          if (value && value !== 'none' && value !== 'normal' && value !== 'auto' && 
              value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
            allProperties[prop] = value;
          }
        } catch (e) {
          // 개별 속성 가져오기 실패 시 무시
        }
      });
      
      // 모든 속성을 한 번에 적용
      Object.entries(allProperties).forEach(([prop, value]) => {
        try {
          el.style.setProperty(prop, value, 'important');
        } catch (e) {
          // 속성 적용 실패 시 무시
        }
      });
    } catch (e) {
      // 요소 처리 실패 시 무시
    }
  });
}

/**
 * 리포트 영역을 복제하고 색상을 RGB로 변환한 후 캡처
 */
async function prepareElementForCapture(originalElement: HTMLElement, reportData?: PDFReportData): Promise<HTMLElement> {
  // 컨테이너 생성 (헤더 + 리포트)
  const container = document.createElement('div');
  // 화면에 보이도록 하되 사용자가 보지 못하게 처리
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = `${originalElement.offsetWidth}px`;
  container.style.maxWidth = `${originalElement.offsetWidth}px`;
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '20px';
  container.style.zIndex = '999999';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.overflow = 'visible';
  
  // 헤더 추가
  if (reportData) {
    const header = document.createElement('div');
    header.style.marginBottom = '20px';
    header.style.paddingBottom = '15px';
    header.style.borderBottom = '2px solid #e0e0e0';
    
      const titleParts = [];
      if (reportData.city) titleParts.push(reportData.city);
      if (reportData.district) titleParts.push(reportData.district);
      if (reportData.dong) titleParts.push(reportData.dong);
      
      const title = titleParts.length > 0 
        ? `${titleParts.join(' ')}의 분석결과`
        : '상권 분석 결과';
      
    header.innerHTML = `
      <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 12px 0; color: rgb(51, 51, 51);">${title}</h1>
      <div style="font-size: 14px; color: rgb(102, 102, 102);">
        ${reportData.businessType ? `<div>업종: ${reportData.businessType}</div>` : ''}
        ${reportData.rent ? `<div>임대료: ${reportData.rent}</div>` : ''}
        ${reportData.score ? `<div style="font-weight: bold; margin-top: 8px;">종합 점수: ${reportData.score}점</div>` : ''}
      </div>
    `;
    container.appendChild(header);
  }
  
  // 원본 요소를 복제 (깊은 복제로 모든 자식 요소 포함)
  const clonedElement = originalElement.cloneNode(true) as HTMLElement;
  // 복제된 요소의 스타일도 설정
  clonedElement.style.width = `${originalElement.offsetWidth}px`;
  clonedElement.style.maxWidth = `${originalElement.offsetWidth}px`;
  clonedElement.style.backgroundColor = '#ffffff';
  container.appendChild(clonedElement);
  
  // DOM에 추가 (computed style을 계산하기 위해 필요)
  document.body.appendChild(container);
  
  // 짧은 딜레이를 주어 스타일이 적용되도록 함
  // requestAnimationFrame을 여러 번 사용하여 확실히 스타일이 적용되도록 함
  return new Promise<HTMLElement>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 컨테이너 높이를 자동으로 설정
        container.style.height = 'auto';
        container.style.maxHeight = 'none';
        
        // 복제된 요소의 높이도 자동으로 설정
        clonedElement.style.height = 'auto';
        clonedElement.style.maxHeight = 'none';
        clonedElement.style.visibility = 'visible';
        clonedElement.style.display = 'block';
        
        // 컨테이너 전체의 computed style을 인라인 스타일로 적용
        applyAllComputedStyles(container);
        
        // 추가 색상 변환 (이중 체크)
        convertElementColorsToRGB(container);
        
        // 모든 요소의 모든 CSS 속성을 computed style로 인라인 적용
        const allElements = [container, ...Array.from(container.querySelectorAll('*'))] as HTMLElement[];
        
        // SVG 요소 제거 (SVG가 lab() 색상을 포함할 수 있음)
        const svgElements = Array.from(container.querySelectorAll('svg'));
        svgElements.forEach(svg => {
          try {
            // SVG를 img로 대체하거나 제거
            svg.remove();
          } catch (e) {}
        });
        
        allElements.forEach(el => {
          try {
            // 모든 속성에서 lab(), oklch(), lch() 함수 제거
            const attributes = Array.from(el.attributes);
            attributes.forEach(attr => {
              try {
                if (attr.value && (attr.value.includes('lab(') || attr.value.includes('oklch(') || attr.value.includes('lch('))) {
                  // 색상 함수를 제거하거나 기본값으로 변경
                  el.removeAttribute(attr.name);
                }
              } catch (e) {}
            });
            
            const computed = window.getComputedStyle(el);
            // computed.length를 사용하여 모든 속성 순회
            for (let i = 0; i < computed.length; i++) {
              const prop = computed[i];
              try {
                let value = computed.getPropertyValue(prop);
                
                // 색상 함수가 포함된 경우 제거
                if (value && (value.includes('oklch') || value.includes('lab(') || value.includes('lch('))) {
                  // 색상 함수를 기본값으로 대체
                  if (prop.includes('color')) {
                    value = 'rgb(0, 0, 0)';
                  } else if (prop.includes('background')) {
                    value = 'rgb(255, 255, 255)';
                  } else {
                    continue; // 이 속성은 건너뛰기
                  }
                }
                
                if (value && !value.includes('oklch') && !value.includes('lab(') && !value.includes('lch(')) {
                  // 중요 속성만 인라인으로 적용
                  if (prop.includes('color') || prop.includes('background') || prop.includes('border') || 
                      prop.includes('font') || prop.includes('padding') || prop.includes('margin') ||
                      prop.includes('display') || prop.includes('flex') || prop.includes('grid') ||
                      prop.includes('width') || prop.includes('height') || prop.includes('position')) {
                    el.style.setProperty(prop, value, 'important');
                  }
                }
              } catch (e) {
                // 개별 속성 처리 실패 시 무시
              }
            }
            
            // 인라인 스타일에서도 색상 함수 제거
            const inlineStyle = el.getAttribute('style');
            if (inlineStyle) {
              const cleanStyle = inlineStyle
                .replace(/oklch\([^)]+\)/gi, '')
                .replace(/lab\([^)]+\)/gi, '')
                .replace(/lch\([^)]+\)/gi, '')
                .replace(/;;+/g, ';')
                .replace(/;\s*;/g, ';')
                .trim();
              if (cleanStyle && cleanStyle !== ';') {
                el.setAttribute('style', cleanStyle);
              } else {
                el.removeAttribute('style');
              }
            }
          } catch (e) {
            // 요소 처리 실패 시 무시
          }
        });
        
        resolve(container);
      });
    });
  });
}

export async function generatePDFReport(
  reportElement: HTMLElement,
  reportData?: PDFReportData
) {
  let clonedElement: HTMLElement | null = null;
  
  try {
    // 리포트 영역을 복제하고 색상을 RGB로 변환 (헤더 포함)
    clonedElement = await prepareElementForCapture(reportElement, reportData);
    
    // 추가 대기 시간을 주어 모든 스타일이 적용되도록 함
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 임시 스타일시트는 생성하지 않음 - 모든 스타일이 이미 인라인으로 적용됨
    
    // 복제된 요소를 이미지로 변환
    // 색상 파싱 오류를 방지하기 위해 여러 옵션 시도
    let canvas: HTMLCanvasElement;
    
    try {
      // 컨테이너의 실제 크기 계산
      const containerWidth = clonedElement.scrollWidth || clonedElement.offsetWidth || reportElement.offsetWidth;
      const containerHeight = clonedElement.scrollHeight || clonedElement.offsetHeight;
      
      canvas = await html2canvas(clonedElement, {
        scale: 2, // 고해상도
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width: containerWidth,
        height: containerHeight,
        windowWidth: containerWidth,
        windowHeight: containerHeight,
        allowTaint: false,
        foreignObjectRendering: false,
        removeContainer: false, // 컨테이너 제거하지 않음
        // CSS 파싱을 우회하기 위한 옵션
        ignoreElements: () => false,
        onclone: (clonedDoc) => {
          try {
            // SVG 요소 제거 (SVG가 lab() 색상을 포함할 수 있음)
            const allSvgs = Array.from(clonedDoc.querySelectorAll('svg'));
            allSvgs.forEach(svg => {
              try {
                if (svg.parentNode) svg.parentNode.removeChild(svg);
              } catch (e) {}
            });
            
            // 모든 스타일시트 관련 요소 완전히 제거
            const allLinks = Array.from(clonedDoc.querySelectorAll('link[rel*="stylesheet"], link[type="text/css"], link'));
            allLinks.forEach(link => {
              try { 
                if (link.parentNode) link.parentNode.removeChild(link);
              } catch (e) {}
            });
            
            const allStyles = Array.from(clonedDoc.querySelectorAll('style'));
            allStyles.forEach(style => {
              try { 
                if (style.parentNode) style.parentNode.removeChild(style);
              } catch (e) {}
            });
            
            // head의 모든 스타일 관련 요소 제거
            const head = clonedDoc.head;
            if (head) {
              const children = Array.from(head.children);
              children.forEach(child => {
                try {
                  const tagName = child.tagName?.toLowerCase();
                  if (tagName === 'link' || tagName === 'style') {
                    head.removeChild(child);
                  }
                } catch (e) {}
              });
            }
            
            // 모든 요소의 모든 속성에서 색상 함수 제거
            const allElements = Array.from(clonedDoc.body.querySelectorAll('*')) as HTMLElement[];
            allElements.forEach(el => {
              try {
                // 모든 속성 확인 및 제거
                const attributes = Array.from(el.attributes);
                attributes.forEach(attr => {
                  if (attr.value && (attr.value.includes('lab(') || attr.value.includes('oklch(') || attr.value.includes('lch('))) {
                    try {
                      el.removeAttribute(attr.name);
                    } catch (e) {}
                  }
                });
                
                // 인라인 스타일에서 색상 함수 제거
                const style = el.getAttribute('style');
                if (style) {
                  const cleanStyle = style
                    .replace(/oklch\([^)]+\)/gi, '')
                    .replace(/lab\([^)]+\)/gi, '')
                    .replace(/lch\([^)]+\)/gi, '')
                    .replace(/;;+/g, ';')
                    .replace(/;\s*;/g, ';')
                    .trim();
                  if (cleanStyle && cleanStyle !== ';') {
                    el.setAttribute('style', cleanStyle);
                  } else {
                    el.removeAttribute('style');
                  }
                }
              } catch (e) {}
            });
          } catch (e) {
            console.warn('onclone 처리 중 오류:', e);
          }
        },
      });
    } catch (html2canvasError: any) {
      // html2canvas 오류 처리 - 색상 파싱 오류인 경우
      const errorMessage = html2canvasError?.message || '';
      const isColorError = errorMessage.includes('color') || 
                          errorMessage.includes('lab') || 
                          errorMessage.includes('oklch') ||
                          errorMessage.includes('lch');
      
      if (isColorError) {
        // 색상 파싱 오류는 경고만 출력하고 계속 진행
        console.warn('색상 파싱 오류가 감지되었지만 계속 진행합니다:', html2canvasError);
        
        // 모든 스타일을 더 공격적으로 인라인으로 변환
        const allElements = [clonedElement!, ...Array.from(clonedElement!.querySelectorAll('*'))] as HTMLElement[];
        
        // 먼저 모든 요소의 모든 computed style을 인라인으로 적용
        allElements.forEach(el => {
          try {
            const computed = window.getComputedStyle(el);
            // 모든 CSS 속성을 인라인으로 적용
            for (let i = 0; i < computed.length; i++) {
              const prop = computed[i];
              try {
                const value = computed.getPropertyValue(prop);
                // oklch, lab, lch 함수가 포함되지 않은 값만 적용
                if (value && 
                    !value.includes('oklch') && 
                    !value.includes('lab(') && 
                    !value.includes('lch(') &&
                    value !== 'none' &&
                    value !== 'normal' &&
                    value !== 'auto') {
                  // 모든 속성을 인라인으로 적용
                  el.style.setProperty(prop, value, 'important');
                }
              } catch (e) {
                // 개별 속성 적용 실패 시 무시
              }
            }
            
            // 추가로 style 속성의 모든 값을 직접 설정
            const inlineStyle = el.getAttribute('style');
            if (inlineStyle) {
              // inline style에서도 oklch, lab, lch 함수 제거
              const cleanStyle = inlineStyle
                .replace(/oklch\([^)]+\)/gi, '')
                .replace(/lab\([^)]+\)/gi, '')
                .replace(/lch\([^)]+\)/gi, '')
                .replace(/;;+/g, ';')
                .trim();
              if (cleanStyle) {
                el.setAttribute('style', cleanStyle);
              }
            }
          } catch (e) {
            // 요소 처리 실패 시 무시
          }
        });
        
        // 스타일 적용 후 충분한 대기 시간
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 스타일시트가 없는 완전히 독립적인 환경에서 재시도
        // 모든 스타일이 인라인으로 적용되어 있으므로 스타일시트가 없어도 작동해야 함
        try {
          canvas = await html2canvas(clonedElement, {
            scale: 1.5,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            allowTaint: false,
            foreignObjectRendering: false,
            onclone: (clonedDoc) => {
              // 스타일시트 완전히 제거
              try {
                const allLinks = Array.from(clonedDoc.querySelectorAll('link, style'));
                allLinks.forEach(node => {
                  try {
                    if (node.parentNode) node.parentNode.removeChild(node);
                  } catch (e) {}
                });
              } catch (e) {}
            },
          });
        } catch (retryError: any) {
          console.error('재시도도 실패:', retryError);
          // 최종 재시도: 매우 단순한 설정으로
          try {
            canvas = await html2canvas(clonedElement, {
              scale: 1,
              backgroundColor: '#ffffff',
              logging: false,
            });
          } catch (finalError) {
            console.error('최종 재시도도 실패:', finalError);
            // 모든 재시도가 실패한 경우, 사용자에게 안내
            throw new Error('PDF 생성 중 색상 처리 오류가 발생했습니다. 브라우저를 최신 버전으로 업데이트하거나, 다른 브라우저에서 시도해주세요.');
          }
        }
      } else {
        throw html2canvasError;
      }
    }
    
    // canvas가 생성되지 않은 경우 처리
    if (!canvas) {
      throw new Error('PDF 이미지 생성에 실패했습니다.');
    }

    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // PDF 생성 - 한글 텍스트를 이미지로만 처리
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    
    // 이미지 크기 계산
    const imgWidth = pageWidth - 2 * margin;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // 이미지만 PDF에 추가 (한글 텍스트는 이미지에 포함되어 있음)
    let heightLeft = imgHeight;
    let position = margin;
    
    // 첫 페이지
    doc.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - 2 * margin);
    
    // 추가 페이지가 필요한 경우
    while (heightLeft > 0) {
      position = -imgHeight + heightLeft + margin;
      doc.addPage();
      doc.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 2 * margin);
    }

    // 파일명 생성
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    const locationStr = reportData?.dong 
      ? `${reportData.district || ''}_${reportData.dong || ''}`
      : '리포트';
    const fileName = `상권분석_${locationStr}_${dateStr}.pdf`;
    
    // PDF 저장
    doc.save(fileName);
    
    // 복제된 요소 제거
    if (clonedElement && clonedElement.parentNode) {
      clonedElement.parentNode.removeChild(clonedElement);
    }
  } catch (error) {
    console.error('PDF 생성 실패:', error);
    
    // 오류 발생 시에도 복제된 요소 제거
    if (clonedElement && clonedElement.parentNode) {
      clonedElement.parentNode.removeChild(clonedElement);
    }
    
    throw error;
  }
}

/**
 * 사용자가 선택한 데이터로 모델을 실행하고 텍스트만 PDF로 저장
 */
export async function generateSimplePDFReport(data: SimplePDFData) {
  try {
    // 모델 실행하여 점수 가져오기
    const response = await axios.post(`${process.env.NEXT_PUBLIC_FLASK_URL}/predict`, {
      lat: data.lat,
      lng: data.lng
    });

    const score = Number(response.data["점수"]).toFixed(1);

    // Canvas를 사용하여 텍스트를 이미지로 변환
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context를 가져올 수 없습니다.');

    // Canvas 크기 설정
    canvas.width = 800;
    canvas.height = 600;
    
    // 배경색 설정
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 텍스트 스타일 설정
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let yPosition = 50;

    // 제목
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('상권 분석 결과', canvas.width / 2, yPosition);
    yPosition += 60;

    // 구분선
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, yPosition);
    ctx.lineTo(canvas.width - 50, yPosition);
    ctx.stroke();
    yPosition += 40;

    // 선택한 정보
    ctx.font = '24px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`업종: ${data.businessType}`, 50, yPosition);
    yPosition += 40;
    
    ctx.fillText(`임대료: ${data.rent.toLocaleString()}만원`, 50, yPosition);
    yPosition += 40;
    
    ctx.fillText(`위치: ${data.city} ${data.district}`, 50, yPosition);
    yPosition += 40;

    // 다운로드 시간
    const downloadTime = new Date();
    const dateStr = `${downloadTime.getFullYear()}.${String(downloadTime.getMonth() + 1).padStart(2, '0')}.${String(downloadTime.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(downloadTime.getHours()).padStart(2, '0')}:${String(downloadTime.getMinutes()).padStart(2, '0')}:${String(downloadTime.getSeconds()).padStart(2, '0')}`;
    ctx.font = '20px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText(`다운로드 시간: ${dateStr} ${timeStr}`, 50, yPosition);
    yPosition += 60;

    // 결과 점수
    ctx.font = 'bold 40px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0066cc';
    ctx.fillText(`결과: ${score}점`, canvas.width / 2, yPosition);

    // Canvas를 이미지로 변환
    const imgData = canvas.toDataURL('image/png');

    // PDF 생성
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    
    // 이미지 크기 계산 (비율 유지)
    const imgWidth = pageWidth - 2 * margin;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // 이미지를 PDF에 추가
    doc.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);

    // 파일명 생성
    const fileName = `상권분석_${data.district}_${dateStr}.pdf`;

    // PDF 저장
    doc.save(fileName);
  } catch (error) {
    console.error('PDF 생성 실패:', error);
    throw error;
  }
}

/**
 * Wizard 검색 조건과 1위 동 정보를 PDF로 저장
 */
export async function generateWizardPDFReport(data: WizardPDFData) {
  try {
    // Canvas를 사용하여 텍스트를 이미지로 변환
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context를 가져올 수 없습니다.');

    // Canvas 크기 설정
    canvas.width = 800;
    canvas.height = 900;
    
    // 배경색 설정
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 텍스트 스타일 설정
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let yPosition = 50;

    // 제목
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('상권 분석 결과 리포트', canvas.width / 2, yPosition);
    yPosition += 60;

    // 구분선
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, yPosition);
    ctx.lineTo(canvas.width - 50, yPosition);
    ctx.stroke();
    yPosition += 40;

    // 검색 조건 섹션
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('검색 조건', 50, yPosition);
    yPosition += 40;

    ctx.font = '20px Arial, sans-serif';
    ctx.fillText(`업종: ${data.businessType}`, 50, yPosition);
    yPosition += 35;
    
    ctx.fillText(`월세: ${data.monthlyRent.toLocaleString()}만원`, 50, yPosition);
    yPosition += 35;
    
    ctx.fillText(`보증금: ${data.deposit.toLocaleString()}만원`, 50, yPosition);
    yPosition += 35;
    
    ctx.fillText(`면적: ${data.area}㎡`, 50, yPosition);
    yPosition += 35;
    
    ctx.fillText(`위치: ${data.city || '서울특별시'} ${data.district}`, 50, yPosition);
    yPosition += 50;

    // 구분선
    ctx.beginPath();
    ctx.moveTo(50, yPosition);
    ctx.lineTo(canvas.width - 50, yPosition);
    ctx.stroke();
    yPosition += 40;

    // 1위 상권 정보 섹션
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText('1위 상권 분석 결과', 50, yPosition);
    yPosition += 40;

    ctx.font = '20px Arial, sans-serif';
    const dongName = data.topDongData.동 || data.topDongData.dong || '1위 동';
    ctx.fillText(`동: ${dongName}`, 50, yPosition);
    yPosition += 35;

    const score = data.topDongData.점수 || data.topDongData.score || 0;
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = '#0066cc';
    ctx.fillText(`예측 점수: ${score.toFixed(1)}점`, 50, yPosition);
    yPosition += 40;

    ctx.font = '20px Arial, sans-serif';
    ctx.fillStyle = '#000000';

    if (data.topDongData.매출 !== undefined && data.topDongData.매출 > 0) {
      const salesText = data.topDongData.매출 >= 100000000 
        ? `${(data.topDongData.매출 / 100000000).toFixed(1)}억 ${((data.topDongData.매출 % 100000000) / 10000).toFixed(0)}만원`
        : `${Math.round(data.topDongData.매출 / 10000)}만원`;
      ctx.fillText(`2025년 예측 매출: ${salesText}`, 50, yPosition);
      yPosition += 35;
    }

    if (data.topDongData.점포수 !== undefined && data.topDongData.점포수 > 0) {
      ctx.fillText(`총 점포수: ${data.topDongData.점포수}개`, 50, yPosition);
      yPosition += 35;
    }

    if (data.topDongData.정규화매출효율 !== undefined) {
      ctx.fillText(`정규화 매출 효율: ${data.topDongData.정규화매출효율.toFixed(2)}%`, 50, yPosition);
      yPosition += 35;
    }

    if (data.topDongData.정규화성장률 !== undefined) {
      ctx.fillText(`정규화 성장률: ${data.topDongData.정규화성장률.toFixed(2)}%`, 50, yPosition);
      yPosition += 35;
    }

    if (data.topDongData.정규화경쟁밀도 !== undefined) {
      ctx.fillText(`정규화 경쟁 밀도: ${data.topDongData.정규화경쟁밀도.toFixed(2)}%`, 50, yPosition);
      yPosition += 40;
    }

    // 다운로드 시간
    const downloadTime = new Date();
    const dateStr = `${downloadTime.getFullYear()}.${String(downloadTime.getMonth() + 1).padStart(2, '0')}.${String(downloadTime.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(downloadTime.getHours()).padStart(2, '0')}:${String(downloadTime.getMinutes()).padStart(2, '0')}:${String(downloadTime.getSeconds()).padStart(2, '0')}`;
    ctx.font = '18px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'center';
    ctx.fillText(`다운로드 시간: ${dateStr} ${timeStr}`, canvas.width / 2, yPosition);

    // Canvas를 이미지로 변환
    const imgData = canvas.toDataURL('image/png');

    // PDF 생성
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    
    // 이미지 크기 계산 (비율 유지)
    const imgWidth = pageWidth - 2 * margin;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // 이미지를 PDF에 추가
    doc.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);

    // 파일명 생성
    const fileName = `상권분석_${data.district}_${dongName}_${dateStr}.pdf`;

    // PDF 저장
    doc.save(fileName);
  } catch (error) {
    console.error('PDF 생성 실패:', error);
    throw error;
  }
}

