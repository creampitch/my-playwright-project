import { test, expect } from '@playwright/test';
const jobData = require('./data.json');

test('ทดสอบสร้าง Job พร้อมระบบ Auto-fill ลูกค้า', async ({ page }) => {
  test.setTimeout(120000);


  await page.goto('https://uat.thecoachcompany.co.uk/admin/');
// 1. จัดการ Dialog
  page.on('dialog', async dialog => {
    console.log(`💬 พบ Dialog: ${dialog.message()}`);
    await dialog.accept();
  });

// 2. Login
  await page.getByPlaceholder(/Username/i).fill(jobData.login.user);
  await page.getByPlaceholder('Please enter Password', { exact: true }).fill(jobData.login.pass);
  await page.getByRole('button', { name: 'LOG IN' }).click();

// 3. ไปหน้า New Job
  const userProfile = page.locator('span').filter({ hasText: jobData.login.user }).first();
  await expect(userProfile).toBeVisible({ timeout: 30000 });

  await page.locator('.sidebar').getByText('Jobs', { exact: true }).click();
  await page.locator('.sidebar').getByRole('link', { name: 'New Job' }).click();

// 4. เลือก Profile
  const profileDropdown = page.getByRole('combobox').first();
  await profileDropdown.selectOption({ label: 'thecoachcompany.co.uk' }); 
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); 

// 5. เลือก Job Template
  const templateDropdown = page.getByRole('combobox').nth(1); 
  await templateDropdown.selectOption({ label: 'Test' });
  await templateDropdown.dispatchEvent('change'); // กระตุ้น AJAX
  await page.waitForTimeout(1500); 
  console.log('✅ เลือก Job Template : Test เรียบร้อย');

// 6. เลือก Journey Type 
  console.log('📝 กำลังรอ Journey Type ');
  const journeyTypeDropdown = page.locator('#default_journey_id');
  //  ใช้ toPass เพื่อวนรอจนกว่าตัวเลือก "78" หรือ "Automation Test" จะถูกโหลดเข้าช่องนี้จริงๆ
  await expect(async () => {
    const listContent = await journeyTypeDropdown.innerText();
    if (!listContent.includes('Automation Test')) {
      throw new Error('Data not arrived yet');
    }
  }).toPass({ timeout: 20000 }); 
  await journeyTypeDropdown.selectOption('78');
  await page.waitForTimeout(1500); 
  console.log('✅ เลือก Journey Type: Automation Test เรียบร้อย');

// 7. Customer
  const companyInput = page.locator('#search_text');
  await companyInput.click();
  await companyInput.pressSequentially('Cream', { delay: 100 });
  console.log('⏳ รอรายการชื่อลูกค้าปรากฏ...');

  // ✅ 1. ระบุ Suggestion Item ให้แม่นยำ
  const suggestionItem = page.locator('#jquery-live-search p')
                             .filter({ hasText: 'Cream (cream@voovadigital.com)' })
                             .first();

  // ✅ 2. รอให้ปรากฏและคลิกเพียงครั้งเดียว
  await suggestionItem.waitFor({ state: 'visible', timeout: 10000 });
  await suggestionItem.click(); 

  // ✅ 3. วิธีปิด Dropdown ให้เสถียร (เลือกใช้อย่างใดอย่างหนึ่ง)
  // วิธี A: กด Enter เพื่อยืนยันการเลือกและปิดรายการ
  await page.keyboard.press('Enter'); 
  
  // วิธี B: คลิกที่หัวข้อส่วนอื่นเพื่อ Blur (ป้องกัน Dropdown ค้าง)
  // await page.locator('strong').filter({ hasText: 'Company/Account' }).click();

  console.log('✅ คลิกเลือก "Cream" สำเร็จ ระบบกำลังดึงข้อมูล...');

// 8. รอและตรวจสอบข้อมูล Auto-fill 
  const emailInput = page.locator('#email');
  const nameInput = page.locator('#name');
  const phoneInput = page.locator('#phone_h');
  //  ใช้ toPass เพื่อรอจนกว่าข้อมูลจะถูกกรอกลงในฟิลด์ (ตรวจจาก Email เป็นหลัก)
  await expect(async () => {
    const emailVal = await emailInput.inputValue();
    if (!emailVal || emailVal.trim() === "") {
      throw new Error("ข้อมูลลูกค้ายังไม่มา...");
    }
  }).toPass({ timeout: 10000 });
  // ดึงค่ามาแสดงผลยืนยัน
  const emailVal = await emailInput.inputValue();
  const nameVal = await nameInput.inputValue();
  const phoneVal = await phoneInput.inputValue();
  console.log(`🎉 ข้อมูลลูกค้าถูกดึงมาครบแล้ว!`);
  console.log(`📧 Email: ${emailVal}`);
  console.log(`👤 Name: ${nameVal}`);
  console.log(`📞 Phone: ${phoneVal}`);

// 9.Transport 
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

  // --- 3. เลือก Vehicle Type ---
  const leftVehicleType = page.locator('#default_car_id');
  await leftVehicleType.selectOption({ label: 'Not Confirm' });;
  console.log('✅ เลือกประเภทรถเรียบร้อย');
  await page.waitForTimeout(1000); 

  // --- 4. เลือก Luggage ---
  const leftLuggage = page.locator('#default_bag_id');
  await expect(leftVehicleType).toContainText('Not Confirm', { timeout: 10000 });
  await leftLuggage.selectOption({ label: 'No luggage.' });
  console.log('✅ เลือกสัมภาระเรียบร้อย');
  await page.waitForTimeout(1000); 

// 10. Pricing: กรอกราคาและกระตุ้นการคำนวณอัตโนมัติ
  const vehiclePriceInput = page.locator('#price'); 
  await vehiclePriceInput.clear();
  await vehiclePriceInput.fill('100');
  // คลิกนอกช่อง หรือกด Tab เพื่อให้ระบบคำนวณ (Blur Event)
  await vehiclePriceInput.press('Tab');
  await page.locator('strong').filter({ hasText: 'Vehicle Price' }).first().click();
  await page.waitForTimeout(1000);
  // ตรวจสอบว่า Total Price (e317) มีการเปลี่ยนแปลงหรือไม่ (Optional)
  const totalPrice = await page.locator('#total_price').inputValue();
  console.log(`📊 ยอดรวมหลังคำนวณอัตโนมัติ: ${totalPrice}`);
  await page.waitForTimeout(1000);

// 11. Misc Section
  console.log('📝 กำลังตั้งค่า Misc...');
  // --- 1. How did you hear of us? ---
  const knowWhere = page.locator('select#know_where');
  await knowWhere.click(); // คลิกเพื่อให้ดรอปดาวน์กางออก (โชว์ Visual)
  await page.waitForTimeout(500);
  // ✅ ใช้ selectOption เพื่อความเสถียรสูงสุด (ระบบจะทำการเลือกให้ทันที)
  await knowWhere.selectOption({ label: 'Comfy Coaches Website' });
  console.log('✅ เลือกช่องทาง: Comfy Coaches Website');
  await page.waitForTimeout(1000);

  // --- 2. Opsperson ---
  const opsPerson = page.locator('select#opsperson');
  await opsPerson.click();
  await page.waitForTimeout(500);
  await opsPerson.selectOption({ label: 'cream intern' });
  console.log('✅ เลือก Opsperson: cream intern');
  await page.waitForTimeout(1000);

  // --- 3. Account Owner ---
  const accountOwner = page.locator('select#salesperson2');
  await accountOwner.click();
  await page.waitForTimeout(500);
  await accountOwner.selectOption({ label: 'cream intern' });
  console.log('✅ เลือก Account Owner: cream intern');
  await page.waitForTimeout(1000);

  // --- 4. Priority ---
  const priority = page.locator('select#priority');
  await priority.click();
  await page.waitForTimeout(500);
  await priority.selectOption({ label: '2' });
  console.log('✅ เลือก Priority: 2');
  await page.waitForTimeout(1000);
  
// 12. ตั้งค่า Pickup Date ผ่าน UI Icon
  console.log('📅 เริ่มขั้นตอนการคลิกเลือกวันที่จากหน้าปฏิทิน...');
  const mainTable = page.locator('table').filter({ hasText: 'Pickup date' });
  // ✅ 1. คลิกไอคอนปฏิทิน
  await mainTable.locator('.fa-calendar').first().click();
  const datePicker = page.locator('.datepicker').last();
  await datePicker.waitFor({ state: 'visible' });
  // ✅ เพิ่มความหน่วงเล็กน้อยเพื่อให้มองทัน (0.5 วินาที)
  const dateSwitch = datePicker.locator('.datepicker-switch').filter({ visible: true }).first();
  await page.waitForTimeout(500); 
  await dateSwitch.click(); // เข้าสู่โหมดเลือกเดือน
  await page.waitForTimeout(500);
  await dateSwitch.click(); // เข้าสู่โหมดเลือกปี
  // ✅ 3. เลือกปี 2030 
  await page.waitForTimeout(500);
  await datePicker.getByText('2030', { exact: true }).click();
  // ✅ 4. เลือกเดือน มกราคม (Jan)
  await page.waitForTimeout(500);
  await datePicker.locator('.month').filter({ hasText: /^Jan$/i }).click();
  // ✅ 5. คลิกเลือกวันที่ 3
  await page.waitForTimeout(500);
  const day3 = datePicker.locator('td.day:not(.old):not(.new)').filter({ hasText: /^3$/ });
  await day3.click();
  console.log('✅ คลิกเลือกวันที่ 03/01/2030 เรียบร้อย');

  // --- ส่วนเวลา (08:00) ---
  console.log('🕒 กำลังเลือกเวลา 08:00...');
  await mainTable.locator('.fa-clock-o').first().click({ force: true });
  const hourSelect = page.locator('div, span, generic').filter({ hasText: /^8$/ }).last();
  const minuteSelect = page.locator('div, span, generic').filter({ hasText: /^00$/ }).last();
  await hourSelect.click();
  await page.waitForTimeout(500);
  await minuteSelect.click();
  await page.waitForTimeout(500);
  await page.mouse.click(10, 10);// ปิด Widget
  //  1. ประกาศตัวแปร dateInput เพื่อให้หุ่นยนต์รู้จักช่องวันที่อีกครั้ง
  const dateInput = mainTable.locator('input[name="collection_date[]"]').first();
  //  2. ตรวจสอบผลลัพธ์สุดท้าย
  const finalDate = await dateInput.inputValue();
  console.log(`📊 ตรวจสอบค่าหลังทำจบทุกสเต็ป - วันที่: ${finalDate}`);

// 13. เปิดแผนที่ Mapbox สำหรับ Collection Address
  console.log('📍 กำลังพยายามคลิกไอคอนเพื่อเปิดแผนที่ Mapbox...');
  const mapIcon = page.locator('[id^="showcol"]').first();
  //  รอให้ปุ่มพร้อม (Visible) ก่อน และสั่ง Scroll ให้เห็นชัดๆ
  await mapIcon.waitFor({ state: 'visible', timeout: 15000 });
  await mapIcon.scrollIntoViewIfNeeded();
  //  คลิกไอคอน (ใช้ force: true เพื่อป้องกันกรณีมีอะไรบัง)
  await mapIcon.click({ force: true });
  //  รอให้ Canvas ของ Mapbox ปรากฏเพื่อยืนยันว่าแผนที่โหลดมาจริงๆ
  const mapCanvas = page.locator('.mapboxgl-canvas');
  await mapCanvas.waitFor({ state: 'visible', timeout: 20000 });
  console.log('🌍 แผนที่ Mapbox แสดงผลเรียบร้อย');
  await page.waitForTimeout(1000);

// 14. ขั้นตอนการลากปักหมุดใน Mapbox
  console.log('🖱️ เริ่มขั้นตอนการลากหมุดไปทางซ้าย...');

  //  1. ระบุ Marker และรอความพร้อม
  const marker = page.locator('.mapboxgl-marker').filter({ visible: true }).first();
  await marker.waitFor({ state: 'attached', timeout: 15000 });
  await expect(marker).toBeVisible({ timeout: 15000 });

  //  2. พักให้พิกัดนิ่งก่อนคำนวณตำแหน่ง
  await page.waitForTimeout(1000); 

  const box = await marker.boundingBox();
  if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      //  3. จับหมุด
      await page.mouse.move(centerX, centerY, { steps: 10 });
      await page.mouse.down();
      await page.waitForTimeout(300); // แช่เมาส์ไว้เล็กน้อยให้ระบบ Map รับรู้การลาก

      //  4. ลากไปทางซ้าย (ลดค่า X ลง 150 พิกเซล โดยแกน Y คงเดิม)
      console.log('👈 กำลังลากหมุดไปทางซ้าย...');
      await page.mouse.move(centerX - 150, centerY, { steps: 30 });
      
      //  5. ปล่อยเมาส์
      await page.mouse.up();
      console.log('✅ ปักหมุดพิกัดใหม่ทางซ้ายเรียบร้อย');
  }

  //  6. ปิดหน้าต่างแผนที่
  const closeBtn = page.locator('a').filter({ hasText: /^x Close$/ }).filter({ visible: true }).first();
  await closeBtn.click({ force: true });
  
  // รอให้หน้าจอหลักพร้อมทำงานต่อ (เลิกใช้ waitFor hidden ของปุ่มปิดที่เคยพัง)
  const destPin = page.locator('[id^="showdes"]').first();
  await destPin.waitFor({ state: 'visible', timeout: 10000 });

// 15. เริ่มจัดการ Destination Address (จุดส่ง)
  console.log('📍 กำลังเปิดแผนที่สำหรับ Destination Address...');
  await destPin.scrollIntoViewIfNeeded();
  await destPin.click({ force: true });
  // รอ Canvas อันใหม่ปรากฏ (ใช้พิกัดที่ต่างจากเดิมเพื่อให้เห็นการทำงาน)
  const mapCanvasDest = page.locator('.mapboxgl-canvas').last();
  await mapCanvasDest.waitFor({ state: 'visible' });
  const markerDest = page.locator('.mapboxgl-marker:visible').first(); // เจาะจงตัวที่มองเห็น
  const boxDest = await markerDest.boundingBox();
  
  if (boxDest) {
      const startX = boxDest.x + boxDest.width / 2;
      const startY = boxDest.y + boxDest.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      
      console.log('🖱️ กำลังลากหมุดปลายทางออกไปทางขวาไกลๆ...');
      // เพิ่มพิกัดให้ต่างจากจุดแรกชัดเจน (ลากไปขวา 400px และลงล่าง 100px)
      await page.mouse.move(startX + 400, startY + 100, { steps: 50 }); 
      await page.waitForTimeout(1000); // พักให้ระบบอัปเดตพิกัด
      
      await page.mouse.up();
      console.log('✅ ปักหมุดจุดส่งเรียบร้อย');
  }

  //  1. ระบุปุ่มปิด (เจาะจงตัวที่ visible เท่านั้น)
  const closeBtnDest = page.locator('a').filter({ hasText: /^x Close$/ }).filter({ visible: true }).first();
  
  console.log('🚪 พยายามคลิกปิดหน้าต่างแผนที่ครั้งสุดท้าย...');
  
  //  2. ใช้แผน 3 ประสานเพื่อปิดหน้าต่างให้สนิท
  await closeBtnDest.click({ force: true, delay: 500 }); // คลิกปุ่มจริง
  await page.keyboard.press('Escape');                  // กดปุ่มลัด
  await page.mouse.click(10, 10);                       // คลิกพื้นที่ว่างด้านนอก (Fallback)

  //  3. รอให้ Canvas หายไป (เปลี่ยนเป็น State 'hidden')
  try {
      await page.locator('.mapboxgl-canvas').waitFor({ state: 'hidden', timeout: 5000 });
  } catch (e) {
      console.log('⚠️ แผนที่ปิดช้า สั่งคลิกซ้ำที่ขอบหน้าจอ...');
      await page.mouse.click(0, 0); 
  }
  
  console.log('🎉 เสร็จสิ้นการเลือกพิกัดทั้งสองจุดและปิดแผนที่เรียบร้อย');

  //  4. ตรวจสอบว่าที่อยู่ถูกกรอกเข้าไปในตารางหรือยัง
  const destInput = page.locator('input[name="destination_address[]"]').first();
  await expect(destInput).not.toBeEmpty({ timeout: 10000 });
  const addressText = await destInput.inputValue();
  console.log(`🏠 ที่อยู่ปลายทางที่ได้: ${addressText}`);

// 16. บันทึกและส่ง (Save and Send)
  console.log('📧 เริ่มขั้นตอน Save and Send...');
  //  1. ดักจับ Dialog แบบครอบคลุม (ใส่ก่อนคลิกปุ่มแรก)
  page.on('dialog', async dialog => {
      console.log(`💬 จัดการ Dialog อัตโนมัติ: ${dialog.message()}`);
      await dialog.accept();
  });
  const saveAndSendBtn = page.getByRole('button', { name: /Save and Send/i }).first();
  await saveAndSendBtn.click({ force: true });
  const emailModal = page.getByRole('dialog').filter({ hasText: /New Email/i });
  await emailModal.waitFor({ state: 'visible', timeout: 15000 });

  //  2. กรอกหัวข้อ Subject (ref=e272) เพื่อป้องกัน Error "Please Enter Subject"
  console.log('📝 กำลังกรอกหัวข้อและเนื้อหาอีเมล...');
  const subjectInput = emailModal.locator('input[name="subject"], #subject').first();
  await subjectInput.fill('Automation Test Job');

  // 3. กรอกเนื้อหาในช่องสีเหลือง (Rich Text Editor)
  const editorFrame = emailModal.frameLocator('iframe[title="Rich Text Editor, singleText"]');
  await editorFrame.locator('body').fill('automated test'); 

  //  4. คลิกยืนยันส่งงาน (Save and Send Job)
  console.log('🔘 กำลังคลิกยืนยันส่งงาน...');
  const finalBtn = emailModal.getByRole('button', { name: 'Save and Send Job' });
  await finalBtn.click({ force: true });

  //  5. เคลียร์ Notification "Email sent" และ "Job Saved"
  console.log('⏳ กำลังเคลียร์แจ้งเตือน...');
  const dismissBtn = page.getByRole('button', { name: 'Dismiss' });
  const jobSavedOkBtn = page.locator('div[role="dialog"]').filter({ hasText: /Job Saved/i }).getByRole('button', { name: 'OK' });
  // รอและปิด Notification (ถ้ามี)
  await Promise.race([
      dismissBtn.waitFor({ state: 'visible', timeout: 5000 }).then(() => dismissBtn.click()),
      jobSavedOkBtn.waitFor({ state: 'visible', timeout: 5000 }).then(() => jobSavedOkBtn.click()),
      page.waitForTimeout(6000) // แผนสำรองถ้าไม่มีอะไรขึ้นมา
  ]).catch(() => {});

  //  6. รอให้หน้าเว็บโหลดเสร็จสมบูรณ์ (รอ Network นิ่ง)
  console.log('⏳ รอระบบบันทึกข้อมูลและโหลดหน้าใหม่...');
  await page.waitForLoadState('networkidle');

  //  7. ดึงเลข Job ID โดยใช้ Selector ที่แม่นยำขึ้น (ref=e156 ใน snapshot ใหม่)
  console.log('🔍 กำลังอ่านเลข Job ID จากหน้าจอสรุปงาน...');
  const jobIdLocator = page.locator('h3').filter({ hasText: /^\d{5,7}/ }).first();
  await jobIdLocator.waitFor({ state: 'visible', timeout: 20000 });  // รอให้เลข Job ปรากฏ
  const fullText = await jobIdLocator.innerText();// อ่านค่าและดึงเฉพาะตัวเลขออกมา
  const jobId = fullText.match(/\d+/)[0]; // ดึงเฉพาะตัวเลข 614xxx
  console.log(`🎉 ภารกิจสำเร็จ! สร้าง Job เลขที่: ${jobId}`);
  await page.screenshot({ path: `job-created-${jobId}.png` });
});
