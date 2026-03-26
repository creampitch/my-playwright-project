  // 5. คลิกเมนู Jobs (มักจะอยู่ทางซ้าย)
  // ใช้การระบุ Text 'Jobs' ให้ชัดเจน
  const jobsMenu = page.locator('.main-sidebar, .sidebar').getByText('Jobs', { exact: true });
  await jobsMenu.click();
  console.log('🖱️ คลิกเมนู Jobs เรียบร้อย');

  // 6. คลิกเมนูย่อย New Job
  // ระบุว่าต้องการ 'New Job' ที่อยู่ใน sidebar เท่านั้น
  const newJobMenu = page.locator('.main-sidebar, .sidebar').getByRole('link', { name: 'New Job', exact: false });
  
  // รอให้เมนูย่อยปรากฏก่อนแล้วค่อยคลิก
  await newJobMenu.waitFor({ state: 'visible', timeout: 10000 });
  await newJobMenu.click();
  console.log('➕ เข้าสู่หน้า New Job เรียบร้อย');

  // 7. ตรวจสอบว่ามาถึงหน้า New Job จริงๆ
  // จาก Page Snapshot (ref=e155) พบหัวข้อ "Create a new quote"
  const pageHeader = page.getByRole('heading', { name: /Create a new quote/i });
  
  await expect(pageHeader).toBeVisible({ timeout: 15000 });
  console.log('✅ ยืนยัน: อยู่บนหน้า New Job (Create a new quote) เรียบร้อย');


  
  // ให้ค้างหน้า New Job ไว้ดูแป๊บนึง
  await page.waitForTimeout(3000);

  // 8. เลือก Profile เป็น 'UATCoacHire' (หรือชื่อตามตัวเลือกที่มีในหน้าเว็บ)
  const profileDropdown = page.getByRole('combobox').first(); // หา Dropdown ตัวแรกในหน้า
  
  // รอให้ Dropdown พร้อมใช้งาน
  await profileDropdown.waitFor({ state: 'visible', timeout: 10000 });

  // เลือก Profile (ปรับตัวอักษรให้ตรงเป๊ะกับตัวเลือกที่คุณเห็นในหน้าจอ)
  // หากในหน้าจอเขียนว่า 'UATCoachHire' ให้ใส่ให้ตรงครับ
  await profileDropdown.selectOption({ label: 'thecoachcompany.co.uk' }); // ตัวอย่างจาก Snapshot เดิม
  // ถ้าต้องการเลือก UATCoachHire ให้ใช้:
  // await profileDropdown.selectOption({ label: 'UATCoachHire' }); 

  console.log('✅ เลือก Profile เรียบร้อยแล้ว');

  // 9. ยืนยันว่าหน้าโหลด Content ของ Profile นั้นขึ้นมาแล้ว
  // ปกติหลังจากเลือก Profile หน้าเว็บจะมีการกระพริบหรือโหลดข้อมูลใหม่
  await page.waitForLoadState('networkidle');

  // ให้หยุดดูผลลัพธ์การเลือกสักนิด
  await page.waitForTimeout(3000);

  // 16. บันทึกงานขั้นต้น (Quick Save)
  console.log('💾 กำลังกด Quick Save...');
  const quickSaveBtn = page.getByRole('button', { name: ' Quick Save' }).first();
  await quickSaveBtn.click();
  //  1. ระบุปุ่ม OK โดยเจาะจงว่าต้องอยู่ใน Dialog "Job Saved!" เท่านั้น
  const alertDialog = page.getByRole('dialog', { name: 'Job Saved!' }).or(page.locator('.swal2-modal'));
  const okBtnInDialog = alertDialog.getByRole('button', { name: 'OK' }).first();
  console.log('⏳ รอ Dialog ปรากฏและกด OK...');
  //  2. รอให้ Dialog และปุ่มแสดงผล
  await okBtnInDialog.waitFor({ state: 'visible', timeout: 15000 });
  //  3. คลิก OK แบบยืดหยุ่น (ใช้ dispatchEvent เพื่อความชัวร์ถ้า click ปกติถูกบล็อก)
  await okBtnInDialog.click({ force: true });
  //  4. รอให้ Dialog ทั้งก้อนหายไปจากหน้าจอ (เสถียรกว่ารอแค่ปุ่ม)
  await alertDialog.waitFor({ state: 'hidden', timeout: 10000 });
  console.log('✅ ปิดหน้าต่างแจ้งเตือน Job Saved เรียบร้อย');

//thecoachcompany.co.uk,Test,Automation Test (Do Not This Touch),Cream,1 Pax,Not Confirm,No luggage.,85,Comfy Coaches Website,cream intern,cream intern,4,03/01/2030,11:00,04/01/2030,15:00,Automation Test Job,Automated Test Content For Round 
//thecoachcompany.co.uk,Test,Automation Test (Do Not This Touch),Cream,1 Pax,Not Confirm,No luggage.,120,Comfy Coaches Website,cream intern,cream intern,5,03/01/2030,13:00,04/01/2030,17:00,Automation Test Job,Automated Test Content For Round 