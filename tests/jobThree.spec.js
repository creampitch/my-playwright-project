import { test, expect } from '@playwright/test';
const jobData = require('./data.json');

test('สร้าง Job 3 ครั้งด้วย Automation', async ({ page }) => {

test.setTimeout(300000);

await page.goto('https://uat.thecoachcompany.co.uk/admin/');

// Dialog handler
page.on('dialog', async dialog => {
  console.log(`💬 Dialog: ${dialog.message()}`);
  await dialog.accept();
});

// =================
// LOGIN
// =================
await page.getByPlaceholder(/Username/i).fill(jobData.login.user);
await page.getByPlaceholder('Please enter Password', { exact: true }).fill(jobData.login.pass);
await page.getByRole('button', { name: 'LOG IN' }).click();

const userProfile = page.locator('span').filter({ hasText: jobData.login.user }).first();
await expect(userProfile).toBeVisible({ timeout: 30000 });

console.log('✅ Login สำเร็จ');


// =================
// LOOP START
// =================

for (let i = 1; i <= 5; i++) {
await page.waitForTimeout(2000);
console.log(`🚀 เริ่มสร้าง Job รอบที่ ${i}`);

// ไปหน้า New Job
await page.locator('.sidebar').getByText('Jobs', { exact: true }).click();
await page.locator('.sidebar').getByRole('link', { name: 'New Job' }).click();

await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);


// =================
// Profile
// =================

const profileDropdown = page.getByRole('combobox').first();
await profileDropdown.selectOption({ label: 'thecoachcompany.co.uk' });

await page.waitForTimeout(3000);


// =================
// Job Template
// =================

const templateDropdown = page.getByRole('combobox').nth(1);

await templateDropdown.selectOption({ label: 'Test' });
await templateDropdown.dispatchEvent('change');

await page.waitForTimeout(1500);

console.log('✅ Template เลือกแล้ว');


// =================
// Journey Type
// =================

const journeyTypeDropdown = page.locator('#default_journey_id');

await expect(async () => {
  const listContent = await journeyTypeDropdown.innerText();

  if (!listContent.includes('Automation Test')) {
    throw new Error('Data not arrived yet');
  }

}).toPass({ timeout: 20000 });

await journeyTypeDropdown.selectOption('78');

console.log('✅ Journey Type OK');


// =================
// Customer
// =================

const companyInput = page.locator('#search_text');

await companyInput.click();

await companyInput.pressSequentially('Cream', { delay: 100 });

const suggestionItem = page
.locator('#jquery-live-search p')
.filter({ hasText: 'Cream (cream@voovadigital.com)' })
.first();

await suggestionItem.waitFor({ state: 'visible', timeout: 10000 });

await suggestionItem.click();

await page.keyboard.press('Enter');

console.log('✅ เลือกลูกค้าแล้ว');


// =================
// Auto fill check
// =================

const emailInput = page.locator('#email');
const nameInput = page.locator('#name');
const phoneInput = page.locator('#phone_h');

await expect(async () => {

  const emailVal = await emailInput.inputValue();

  if (!emailVal) {
    throw new Error('customer not loaded');
  }

}).toPass({ timeout: 10000 });

console.log('🎉 Customer Autofill OK');
// ==========================================
// 9. Transport - เน้นความเสถียรและกัน Alert แทรก
// ==========================================
console.log(`🚌 [รอบ ${i}] กำลังเลือกรายละเอียดรถ...`);

// --- 1. เลือก Pax ---
const leftPax = page.locator('#default_num_id');
await expect(leftPax).toContainText('1 Pax', { timeout: 15000 });
await leftPax.selectOption({ label: '1 Pax' });
console.log('✅ เลือก Pax เรียบร้อย');
await page.waitForTimeout(1000); 

// --- 2. เลือก Number of Vehicles ---
const leftVehicleCount = page.locator('#default_num_vehicle');
await leftVehicleCount.selectOption({ label: '1 vehicle' });
console.log('✅ เลือกจำนวนรถเรียบร้อย');
await page.waitForTimeout(1000); 

// --- 3. เลือก Vehicle Type (จุดที่มักเกิด Alert) ---
const leftVehicleType = page.locator('#default_car_id');
await leftVehicleType.selectOption({ label: 'Not Confirm' });
console.log('✅ เลือกประเภทรถเรียบร้อย');

// 🧹 จัดการ Alert "Do you want to change?" ที่มักเด้งตรงนี้
const swalConfirm = page.locator('.swal2-confirm');
if (await swalConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('🧹 เคลียร์แจ้งเตือน Do you want to change...');
    await swalConfirm.click();
    await page.locator('.swal2-container').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
}
await page.waitForTimeout(1000); 

// --- 4. เลือก Luggage ---
const leftLuggage = page.locator('#default_bag_id');
await expect(leftVehicleType).toContainText('Not Confirm', { timeout: 10000 });
await leftLuggage.selectOption({ label: 'No luggage.' });
console.log('✅ เลือกสัมภาระเรียบร้อย');
await page.waitForTimeout(1000);

// =================
// Price
// =================

const vehiclePriceInput = page.locator('#price');

await vehiclePriceInput.fill('100');

await vehiclePriceInput.press('Tab');

await page.waitForTimeout(1000);

const totalPrice = await page.locator('#total_price').inputValue();

console.log(`💰 Total price ${totalPrice}`);


// ==========================================
// 11. Misc - ปรับปรุงเพื่อความเสถียร (ลบการ Click ออก)
// ==========================================
console.log('📝 กำลังตั้งค่า Misc...');

const miscSettings = [
    { id: 'know_where', value: 'Comfy Coaches Website' },
    { id: 'opsperson', value: 'cream intern' },
    { id: 'salesperson2', value: 'cream intern' },
    { id: 'priority', value: '3' }
];

for (const item of miscSettings) {
    const selectLocator = page.locator(`select#${item.id}`);
    
    // 1. รอให้ Element ปรากฏและพร้อมใช้งาน
    await selectLocator.scrollIntoViewIfNeeded();
    await expect(selectLocator).toBeVisible({ timeout: 10000 });

    // 2. เลือก Option โดยตรง (ไม่ต้อง .click() ก่อน)
    // Playwright จะจัดการรอให้เลือกได้เอง
    await selectLocator.selectOption({ label: item.value });
    
    // 3. กระตุ้นระบบให้บันทึกค่า (ถ้าจำเป็นจริงๆ)
    await selectLocator.dispatchEvent('change'); 
    
    console.log(`✅ เลือก ${item.id} -> ${item.value} เรียบร้อย`);
    
    // พักเล็กน้อยเพื่อให้ UI อัปเดตสถานะภายใน
    await page.waitForTimeout(300); 
}

// 12. Date picker
  const mainTable = page.locator('table').filter({ hasText: 'Pickup date' });
  await mainTable.locator('.fa-calendar').first().click();

  const datePicker = page.locator('.datepicker').last();
  await expect(datePicker).toBeVisible();

  // ✅ แก้ไข: คลิกเปลี่ยนโหมดปฏิทินแบบใจเย็น (ใช้ Fresh Locator ทุกครั้ง)
  // คลิกครั้งที่ 1: เปลี่ยนไปโหมดเลือกเดือน
  await datePicker.locator('.datepicker-switch').filter({ visible: true }).first().click();
  await page.waitForTimeout(500); 

  // คลิกครั้งที่ 2: เปลี่ยนไปโหมดเลือกปี
  await datePicker.locator('.datepicker-switch').filter({ visible: true }).first().click();
  await page.waitForTimeout(500); 

  // เลือกปี 2030
  await datePicker.getByText('2030', { exact: true }).click();
  await page.waitForTimeout(300);
  
  // เลือกเดือน Jan
  await datePicker.locator('.month').filter({ hasText: /^Jan$/ }).click();
  await page.waitForTimeout(300);

  // เลือกวันที่ 3
  await datePicker.locator('td.day:not(.old):not(.new)').filter({ hasText: /^3$/ }).click();
  console.log('📅 Date OK');

  // --- ส่วนเวลา (08:00) สำหรับ Pickup แรก ---
  console.log('🕒 กำลังเลือกเวลา 08:00...');
  // คลิกไอคอนนาฬิกาในตารางหลัก
  await mainTable.locator('.fa-clock-o').first().click({ force: true });
  
  // เลือกเลข 8 และ 00 (ใช้ .last() เพื่อความแม่นยำ)
  await page.locator('div, span, generic').filter({ hasText: /^8$/ }).last().click();
  await page.waitForTimeout(300);
  await page.locator('div, span, generic').filter({ hasText: /^00$/ }).last().click();
  
  // คลิกที่ว่างเพื่อปิด Widget
  await page.mouse.click(10, 10); 
  console.log('✅ เลือกเวลา 08:00 เรียบร้อย');


// --- 13. Mapbox Collection (ปักหมุดจุดรับ) ---
console.log(`📍 [รอบ ${i}] กำลังปักหมุดจุดรับ...`);

// 🧹 ล้างค่าเก่าทิ้งก่อนเริ่ม เพื่อให้มั่นใจว่าค่าที่ได้คือของรอบนี้จริงๆ
const colInput1 = page.locator('input[name="collection_address[]"]').first();
await colInput1.evaluate(el => el.value = '');

await page.locator('[id^="showcol"]').first().click({ force: true });
await page.locator('.mapboxgl-canvas').waitFor({ state: 'visible',timeout: 15000 });

// ✅ ใช้ toPass ครอบเพื่อให้หุ่นยนต์รอจนกว่า Geocoding จะคืนค่าสำเร็จ
await expect(async () => {

    if (page.isClosed()) return; 
    const markerCol = page.locator('.mapboxgl-marker:visible').first();
    await expect(markerCol).toBeVisible({ timeout: 5000 });
    const boxCol = await markerCol.boundingBox();
    
   if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(1000); 
        
        const dynamicOffset = 150 + (i * 10);
        await page.mouse.move(box.x + dynamicOffset, box.y + dynamicOffset, { steps: 50 }); 
        await page.waitForTimeout(2000);
        await page.mouse.up();
        
        // ⏳ รอ Geocoding สั้นๆ ภายในลูป
        await page.waitForTimeout(3000); 
    }

    const addressVal = await colInput1.inputValue();
    if (!addressVal || addressVal.trim() === "") throw new Error("❌ ที่อยู่ยังไม่มา");

    // ✅ 2. ย้ายปุ่มปิด Modal เข้ามาข้างใน ToPass เพื่อยืนยันว่าปิดได้สำเร็จพร้อมข้อมูล
    const closeBtn = page.locator('a').filter({ hasText: /^x Close$/ }).filter({ visible: true }).first();
    await closeBtn.click({ force: true });
    
    // ⚠️ รอให้ม่านดำหายไปจริงๆ ถึงจะถือว่าผ่านเงื่อนไข ToPass
    await page.locator('.modal-backdrop').waitFor({ state: 'hidden', timeout: 5000 });

}).toPass({ timeout: 45000, intervals: [3000] });

console.log('✅ ปักหมุดและปิดแผนที่จุดรับสำเร็จ');

// --- 14. จัดการ Destination Address ---
  // ✅ 1. ประกาศตัวแปร destPin ก่อนเรียกใช้งาน
  const destPin = page.locator('[id^="showdes"]').first();

  console.log('📍 กำลังเปิดแผนที่สำหรับ Destination Address...');
  await destPin.scrollIntoViewIfNeeded();
  await destPin.click({ force: true });

  // 2. รอ Canvas อันใหม่ปรากฏ
  const mapCanvasDest = page.locator('.mapboxgl-canvas').last();
  await mapCanvasDest.waitFor({ state: 'visible' });

  // ✅ 3. ใช้ loop 'toPass' เพื่อการันตีการลากหมุดเปลี่ยนที่อยู่
  await expect(async () => {
    const markerDest = page.locator('.mapboxgl-marker:visible').first();
    const boxDest = await markerDest.boundingBox();

    if (boxDest) {
      const centerX = boxDest.x + boxDest.width / 2;
      const centerY = boxDest.y + boxDest.height / 2;

      // 1. เลื่อนไปหาหมุดและกดค้างให้นิ่ง (Long Press)
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.waitForTimeout(1000); 

      console.log('🖱️ กำลังลากแบบยึกยัก (Zigzag) เพื่อกระตุ้นระบบ Map...');
      
      // 2. ลากแบบ Zigzag เล็กน้อยเพื่อปลุก Event Listener ของเว็บ
      await page.mouse.move(centerX + 50, centerY + 20, { steps: 20 });
      await page.mouse.move(centerX + 150, centerY + 50, { steps: 50 }); 
      
      // 3. ⚠️ จุดสำคัญ: แช่เมาส์ค้างไว้ที่จุดหมาย 2 วินาที (ห้ามรีบปล่อย)
      await page.waitForTimeout(2000); 
      await page.mouse.up();

      // 4. รอให้ API ของ Map ส่งค่ากลับเข้าช่อง Input
      console.log('⏳ รอ Geocoding ประมวลผล...');
      await page.waitForTimeout(3000);
    }

    // 🔍 ตรวจสอบ: ต้องไม่ใช่ค่าว่าง และไม่ใช่พิกัดเริ่มต้น (Virginia)
    // 💡 เพิ่มการตรวจสอบ Merchant City (ที่อยู่เริ่มต้นของแถว 2) ด้วย
    // ✅ แก้ไข: ใช้ .first() แทน .nth(1) เพราะรอบนี้มี Movement เดียว
    const destInput = page.locator('input[name="destination_address[]"]').first();
    const currentAddr = await destInput.inputValue();
    
    console.log(`📡 ตรวจสอบที่อยู่ปัจจุบัน: ${currentAddr || 'ว่างเปล่า'}`);

    if (!currentAddr || currentAddr.trim() === "" || currentAddr.includes('Virginia Street')) { 
        throw new Error("⚠️ พิกัดยังไม่ยอมเปลี่ยนจากจุดเดิม พยายามลากใหม่...");
    }
  }).toPass({ timeout: 35000, intervals: [2000] });

  console.log('✅ ปักหมุดสำเร็จและยืนยันที่อยู่ใหม่เรียบร้อย');

  // 4. ปิดแผนที่
  const closeBtnDest = page.locator('a').filter({ hasText: /^x Close$/ }).filter({ visible: true }).first();
  await closeBtnDest.click({ force: true });
  await page.locator('.modal-backdrop').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

  console.log(`🏠 ที่อยู่ปลายทางที่ได้: ${await page.locator('input[name="destination_address[]"]').first().inputValue()}`);


   // --- 15. Save and Send ---
    console.log('📧 กำลังคลิก Save and Send...');
    await page.getByRole('button', { name: /Save and Send/i }).first().click({ force: true });

    // ✅ 1. เคลียร์สิ่งกีดขวาง ( Lack of Suppliers / Alert )
    // ใช้ Selector ที่คลุมทั้งปุ่มปิด Modal และปุ่ม OK ของ SweetAlert
    const anyCloseBtn = page.locator('.modal.in button.close, .swal2-confirm:visible').first();
    if (await anyCloseBtn.isVisible()) {
        console.log('🧹 เคลียร์แจ้งเตือนที่ขวางหน้าจอ...');
        await anyCloseBtn.click({ force: true });
        // ⚠️ รอจนกว่าม่านดำจะหายไปจริงๆ
        await page.locator('.modal-backdrop').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(1000); 
    }

    // ✅ 2. รอและกรอก Email Modal แบบเสถียร (Fresh Locator)
    console.log('📧 กำลังรอ Email Modal...');
    await expect(async () => {
        // หา Modal ที่มีคำว่า New Email อยู่ในหัวข้อ
        const currentModal = page.locator('.modal.in, .modal.show').filter({ hasText: /New Email/i });
        await expect(currentModal).toBeVisible({ timeout: 5000 });
        
        // กรอก Subject สดๆ ภายในลูป Retry
    const subject = currentModal.locator('#emailsubject').first();
    await subject.fill(`Automation Test Job Round ${i}`);
        console.log(`✅ [รอบ ${i}] กรอก Subject สำเร็จ`);
    }).toPass({ timeout: 30000, intervals: [2000] });

// ✅ 3. กรอกเนื้อหาใน Editor (เจาะจงไปที่ singleText)
    console.log(`📝 กำลังกรอกเนื้อหาอีเมลรอบที่ ${i}...`);
    // ใช้ title ที่เฉพาะเจาะจงเพื่อแก้ปัญหา strict mode violation
    const emailEditor = page.frameLocator('iframe[title*="singleText"]').locator('body');
    
    // รอให้พร้อมก่อนพิมพ์
    await emailEditor.waitFor({ state: 'visible', timeout: 10000 });
    await emailEditor.fill(`Automated test content for round ${i}`);

    // ✅ 4. คลิกส่งงาน (ใช้ Selector ที่แม่นยำขึ้นจาก Modal ปัจจุบัน)
    console.log('🔘 คลิกปุ่ม Save and Send Job...');
    const finalSubmitBtn = page.locator('.modal.in').getByRole('button', { name: 'Save and Send Job' });
    await finalSubmitBtn.click({ force: true });


// =================
// Job ID
// =================

await page.waitForLoadState('networkidle');

const jobIdLocator = page.locator('h3').filter({ hasText: /^\d{5,7}/ }).first();

await jobIdLocator.waitFor({ state: 'visible', timeout: 20000 });

const fullText = await jobIdLocator.innerText();

const jobId = fullText.match(/\d+/)[0];

console.log(`🎉 รอบที่ ${i} สร้าง Job สำเร็จ ID: ${jobId}`);

await page.screenshot({ path: `job-${i}-${jobId}.png` });

await page.waitForTimeout(2000);

}

console.log('🏁 สร้าง Job ครบ 3 รอบแล้ว');

});