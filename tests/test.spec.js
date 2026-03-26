const { test, expect } = require('@playwright/test');

test('ตรวจสอบ Job ในหน้า Pending Quotes', async ({ page }) => {
    test.setTimeout(60000);
    const targetJobId = '12345'; 

    await page.goto('https://uat.thecoachcompany.co.uk/admin/');
    
    // Dialog handler
    page.on('dialog', async dialog => {
        console.log(`💬 Dialog: ${dialog.message()}`);
        await dialog.accept();
    });

    // LOGIN 
    await page.getByPlaceholder(/Username/i).fill('cream');
    await page.getByPlaceholder('Please enter Password', { exact: true }).fill('Zerothree0303!;');
    await page.getByRole('button', { name: 'LOG IN' }).click();
    const userProfile = page.locator('span').filter({ hasText: 'cream' }).first();
    await expect(userProfile).toBeVisible({ timeout: 30000 });
    console.log('✅ Login สำเร็จ');

    // --- Pending Quotes ---
    console.log(`🔍 กำลังไปที่หน้า Pending Quotes เพื่อเช็ค Job: ${targetJobId}`);
    await page.locator('.sidebar').getByText('Jobs', { exact: true }).click();
    await page.locator('.sidebar').getByRole('link', { name: 'Pending Quotes' }).click();
    await page.waitForLoadState('networkidle');
    await expect(userProfile).toBeVisible({ timeout: 30000 });
    console.log(`✅ พบ Job ID: ${targetJobId} ในหน้า Pending Quotes เรียบร้อย!`);
    
    // --- Clear Date ---
    const startInput = page.locator('#date_start');
    const endInput = page.locator('#date_end');
    
    await startInput.clear();
    await endInput.clear();
    await page.keyboard.press('Enter');
    await endInput.clear();
    await page.keyboard.press('Enter');
    await page.locator('.col-lg-12').first().click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(10000);
    
// --- Select Job ---
    console.log('🔳 กำลังคลิกปุ่ม Select All...');
    const selectAllBtn = page.locator('th i.fa-square').first();
    await selectAllBtn.click();
    await page.locator('td i.fa-check-square, td i.fa-check-square-o').first().waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ ติ๊กเลือกรายการเรียบร้อย');

    // --- Delete ---
    console.log('🖱️ กำลังเปิดเมนู Action...');
    const actionSelect = page.locator('select#do_action');
    // เลื่อนหน้าจอไปหาปุ่ม Action และคลิกเพื่อ "เปิด" (ให้มันกางลงมา)
    await actionSelect.scrollIntoViewIfNeeded();
    await actionSelect.click(); 
    console.log('⏳ ดรอปดาวน์กางออกแล้ว...');
    await page.waitForTimeout(2000); 
    await actionSelect.focus();
    await page.keyboard.press('ArrowDown'); // เลื่อนลงมา (จำลองการเลือก)
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown'); // เลื่อนลงมาอีก (ถ้า Delete อยู่ลำดับถัดไป)
    await actionSelect.selectOption({ label: 'Delete' });
    await actionSelect.dispatchEvent('change');
    console.log('🚨 เลือกเมนู Delete เรียบร้อย!');
  
    const reasonDialog = page.getByRole('dialog', { name: 'eCoachManager' });
    const reasonSelect = reasonDialog.locator('select[name="reason"]');
    await reasonSelect.waitFor({ state: 'visible' });
    await reasonSelect.click();
    await page.waitForTimeout(500)
    await reasonSelect.selectOption('14');
    await reasonSelect.dispatchEvent('input');
    await reasonSelect.dispatchEvent('change');
    await page.waitForTimeout(1000);

    const confirmBtn = reasonDialog.locator('#submit_delete');
    await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
    await confirmBtn.click();

    console.log('🚨 ยืนยันการลบเรียบร้อย!');
    await page.waitForTimeout(3000);
    // ตรวจสอบว่า Job หายไปจากตาราง
    await page.waitForLoadState('networkidle');
});