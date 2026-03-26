import { test, expect } from '@playwright/test';

test('ทดสอบ Login และจัดการป็อบอัพ', async ({ page }) => {
  test.setTimeout(70000); 

  await page.goto('https://uat.thecoachcompany.co.uk/admin/');

  // 1. ดักจับ Dialog (Pop-up แบบ Browser Native) ล่วงหน้า
  // ถ้ามี Alert หรือ Confirm เด้งขึ้นมา มันจะกด Accept (OK) ให้ทันที
  page.on('dialog', async dialog => {
    console.log(`พบ Dialog: ${dialog.message()}`);
    await dialog.accept();
  });

  // 2. กรอกข้อมูล
  await page.getByPlaceholder(/Username/i).fill('cream');
  await page.getByPlaceholder('Please enter Password', { exact: true }).fill('Zerothree03!');

  // 3. คลิก Login 
  // การที่มี Dialog Handler (ข้อ 1) รออยู่ จะทำให้ถ้าคลิกแล้วมี Pop-up มันจะถูกจัดการทันที
  await page.getByRole('button', { name: 'LOG IN' }).click();

  console.log('กำลังตรวจสอบการเข้าสู่หน้า Dashboard...');

  // 4. ยืนยันว่าเข้าหน้า Dashboard สำเร็จจริงๆ
  // รอให้ชื่อ User หรือเมนูที่ควรจะมีเฉพาะในหน้า Dashboard ปรากฏขึ้นมา
  const userProfile = page.locator('span').filter({ hasText: /cream/i }).first();
  await expect(userProfile).toBeVisible({ timeout: 30000 });

  console.log('ยินดีด้วย! เข้าสู่หน้า Dashboard สำเร็จแล้ว');
  // เพิ่มบรรทัดนี้: ให้ค้างไว้ 5 วินาที
  await page.waitForTimeout(5000);
  
});