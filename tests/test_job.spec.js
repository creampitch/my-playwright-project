const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path'); 
const { parse } = require('csv-parse/sync');

// ✅ โหลดไฟล์ CSV (ที่มีข้อมูลชุดเดียว)
const csvPath = path.join(__dirname, '..', 'page', 'job_data.csv');
const records = parse(fs.readFileSync(csvPath, 'utf-8'), {
    columns: true,
    skip_empty_lines: true
});

test('สร้าง Job อัตโนมัติ - วนลูป 5 รอบจาก CSV ชุดเดียว', async ({ page }) => {

    await page.goto('https://uat.thecoachcompany.co.uk/admin/');

    test.setTimeout(15 * 60 * 1000);
    const createdJobIds = [];
    let userProfile;

    page.on('dialog', async dialog => {
        console.log(`💬 Dialog: ${dialog.message()}`);
        await dialog.accept();
    });

    // ---  LOGIN  ---
    await page.getByPlaceholder(/Username/i).fill('cream');
    await page.getByPlaceholder('Please enter Password', { exact: true }).fill('Zerothree0303!;');
    await page.getByRole('button', { name: 'LOG IN' }).click();
    userProfile = page.locator('span').filter({ hasText: 'cream' }).first();
    await expect(userProfile).toBeVisible({ timeout: 30000 });
    await expect(page.locator('.sidebar')).toBeVisible({ timeout: 30000 });
    console.log('✅ Login สำเร็จ');


    for (let i = 1; i <= 3; i++) {
        // ✅ บังคับให้หยิบข้อมูลจาก CSV แถวแรก (Index 0) มาใช้ในทุกรอบ
        const record = records[0]; 
        
        console.log(`🚀 [รอบที่ ${i}] กำลังสร้าง Job โดยใช้ข้อมูล: ${record.emailsubject}`);

        // --- New Job Page ---
        await page.locator('.sidebar').getByText('Jobs', { exact: true }).click();
        await page.locator('.sidebar').getByRole('link', { name: 'New Job' }).click();
        await page.waitForLoadState('networkidle');

        // --- Job Template ---
        await page.getByRole('combobox').first().selectOption({ label: record.profile });
        await page.getByRole('combobox').nth(1).selectOption({ label: record.template });
        await page.locator('select').nth(1).dispatchEvent('change');
        await page.waitForTimeout(1500);

        // --- Journey Type ---
        const journeyTypeDropdown = page.locator('#default_journey_id');
        await expect(async () => {
            const listContent = await journeyTypeDropdown.innerText();
            if (!listContent.includes(record.journey_type)) {
                throw new Error(`Data not arrived yet`);
            }
        }).toPass({ timeout: 20000 });
        await journeyTypeDropdown.selectOption({ label: record.journey_type.trim() });
        await journeyTypeDropdown.dispatchEvent('change');

        // --- Customer Search ---
        const companyInput = page.locator('#search_text');
        await companyInput.click();
        await companyInput.pressSequentially(record.customer_name, { delay: 150 });
        
        const suggestionItem = page.locator('#jquery-live-search p').filter({ hasText: record.customer_name }).first();
        await suggestionItem.waitFor({ state: 'visible' });
        await suggestionItem.click();
        await page.keyboard.press('Enter');

        // --- Transport & Pricing ---
        await page.locator('#default_num_id').selectOption({ label: record.pax });
        await page.locator('#default_num_vehicle').selectOption({ label: '1 vehicle' });
        await page.locator('#default_car_id').selectOption({ label: record.vehicle_type });
        
        const swalConfirm = page.locator('.swal2-confirm');
        if (await swalConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
            await swalConfirm.click();
            await page.locator('.swal2-container').waitFor({ state: 'hidden' });
        }
        
        await page.locator('#default_bag_id').selectOption({ label: record.luggage });
        await page.locator('#price').fill(record.price);
        await page.keyboard.press('Tab');

        // --- Misc (Scroll Down) ---
        const miscSettings = [
            { id: 'know_where', value: record.know_where },
            { id: 'opsperson', value: record.ops_person },
            { id: 'salesperson2', value: record.salesperson2 },
            { id: 'priority', value: record.priority }
        ];

        for (const item of miscSettings) {
            const selectLocator = page.locator(`select#${item.id}`);
            await selectLocator.scrollIntoViewIfNeeded(); 
            await selectLocator.selectOption({ label: item.value });
            await selectLocator.dispatchEvent('change');
            await page.waitForTimeout(300); 
        }

        // --- Date Picker (Pickup 1) ---
        const mainTable = page.locator('table').filter({ hasText: 'Pickup date' });
        await mainTable.locator('.fa-calendar').first().click();
        const dp = page.locator('.datepicker').last();
        await dp.locator('.datepicker-switch').filter({ visible: true }).first().click(); 
        await dp.locator('.datepicker-switch').filter({ visible: true }).first().click(); 
        await dp.getByText('2030', { exact: true }).click();
        await dp.locator('.month').filter({ hasText: /^Jan$/ }).click();
        await dp.locator('td.day:not(.old):not(.new)').filter({ hasText: /^3$/ }).click();

        await mainTable.locator('.fa-clock-o').first().click({ force: true });
        await page.locator('div, span, generic').filter({ hasText: /^8$/ }).last().click();
        await page.locator('div, span, generic').filter({ hasText: /^00$/ }).last().click();
        await page.mouse.click(10, 10);

        // --- Mapbox Collection 1 (จุดรับ) ---
        console.log(`📍 [รอบ ${i}] กำลังปักหมุดจุดรับ...`);
        const colInput1 = page.locator('input[name="collection_address[]"]').first();
        await colInput1.evaluate(el => el.value = '');
        await page.locator('[id^="showcol"]').first().click({ force: true });
        await page.locator('.mapboxgl-canvas').waitFor({ state: 'visible', timeout: 15000 });

        await expect(async () => {
            const marker = page.locator('.mapboxgl-marker:visible').first();
            const box = await marker.boundingBox();
            if (box) {
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await page.mouse.down();
                const dynamicX = 150 + (i * 20);
                const dynamicY = 150 + (i * 10);
                await page.mouse.move(box.x + dynamicX, box.y + dynamicY, { steps: 40 });
                await page.mouse.up();
                await page.waitForTimeout(2000);
            }
            const currentAddr = await colInput1.inputValue();
            if (!currentAddr || currentAddr.includes('Merchant City')) throw new Error("พิกัดไม่เปลี่ยน");
            await page.locator('a').filter({ hasText: /^x Close$/ }).first().click({ force: true });
        }).toPass({ timeout: 60000, intervals: [2000] });

        await page.locator('.modal-backdrop').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

        // --- Mapbox Destination 1 (จุดส่ง) ---
        console.log(`📍 [รอบ ${i}] กำลังปักหมุด Destination 1...`);
        await page.locator('[id^="showdes"]').first().click({ force: true });
        await page.locator('.mapboxgl-canvas').last().waitFor({ state: 'visible' });

        await expect(async () => {
            const marker = page.locator('.mapboxgl-marker:visible').first();
            const box = await marker.boundingBox();
            if (box) {
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await page.mouse.down();
                await page.mouse.move(box.x + 200, box.y + 50, { steps: 30 });
                await page.mouse.up();
                await page.waitForTimeout(2000);
            }
            const addr1 = await page.locator('input[name="destination_address[]"]').first().inputValue();
            if (!addr1 || addr1.includes('Merchant City')) throw new Error("Destination 1 ไม่เปลี่ยน");
             await page.locator('a').filter({ hasText: /^x Close$/ }).first().click();
        }).toPass({ timeout: 20000, intervals: [1000] });

        await page.locator('.modal-backdrop').waitFor({ state: 'hidden' });

        // --- Add Movement 2 ---
        console.log('➕ คลิก Add Movement');
        await page.getByRole('button', { name: ' Add Movement' }).click({ force: true });
        const currentRow2 = page.locator('tr').filter({ hasText: 'Collection Address(2)' });
        const collectionInput2 = page.locator('input[name="collection_address[]"]').nth(1);
        await collectionInput2.waitFor({ state: 'visible' });

        console.log('⏰ กำลังตั้งเวลาสำหรับ Movement 2...');
        const timeBtn2 = currentRow2.locator('.fa-clock-o').first();
        await timeBtn2.scrollIntoViewIfNeeded();
        await timeBtn2.click({ force: true });
        await page.locator('div, span, generic').filter({ hasText: /^11$/ }).last().click();
        await page.locator('div, span, generic').filter({ hasText: /^00$/ }).last().click();
        await page.mouse.click(10, 10);

        // ดึงที่อยู่จาก Dest 1 มาใส่ Collection 2
        const addressFromDest1 = await page.locator('input[name="destination_address[]"]').first().inputValue();
        await collectionInput2.evaluate((el, val) => { el.value = val; el.dispatchEvent(new Event('change', { bubbles: true })); }, addressFromDest1)

        // --- Destination 2 ---
        console.log('📍 กำลังเปลี่ยนพิกัดจุดส่งรายการที่ 2...');
        await currentRow2.locator('[id^="showdes"]').click({ force: true });;
        await expect(async () => {
            const marker2 = page.locator('.mapboxgl-marker:visible').first();
            const box2 = await marker2.boundingBox();
            if (box2) {
                await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
                await page.mouse.down();
                await page.mouse.move(box2.x + 300, box2.y + 150, { steps: 30 });
                await page.mouse.up();
                await page.waitForTimeout(1000);
            }
            const destInput2 = page.locator('input[name="destination_address[]"]').nth(1);
            const currentAddr = await destInput2.inputValue();
            if (!currentAddr || currentAddr.includes('Virginia')) throw new Error("พิกัด 2 ไม่เปลี่ยน");
            await page.locator('a').filter({ hasText: /^x Close$/ }).filter({ visible: true }).first().click({ force: true });
        }).toPass({ timeout: 30000, intervals: [1000] });

        
        await page.locator('.modal-backdrop').waitFor({ state: 'hidden' }).catch(() => {});;
        await page.waitForTimeout(2000);

        // --- Save and Send (CSV + Round Index) ---
        await page.getByRole('button', { name: /Save and Send/i }).first().click({ force: true });
        const emailModal = page.locator('.modal.in').filter({ hasText: /New Email/i });
        await emailModal.waitFor({ state: 'visible' });

        // ✅ เติม i เข้าไปเพื่อให้ Subject แต่ละรอบไม่ซ้ำกัน
        await emailModal.locator('#subject, input[name="subject"]').first().fill(`${record.emailsubject} Round ${i} - 2 Movements`); 
        await page.frameLocator('iframe[title*="singleText"]').locator('body').fill(`${record.email_content} Round ${i}`);
        await emailModal.getByRole('button', { name: 'Save and Send Job' }).click({ force: true });

        // --- Job ID and Screenshot ---
        const jobIdLocator = page.locator('h3').filter({ hasText: /^\d{5,7}/ }).first();
        await jobIdLocator.waitFor({ state: 'visible' });
        const jobId = (await jobIdLocator.innerText()).match(/\d+/)[0];
        console.log(`🎉 [รอบที่ ${i}] สำเร็จ! Job ID: ${jobId}`);
        //await page.screenshot({ path: `round-${i}-job-${jobId}.png`, fullPage: true });
        await page.waitForTimeout(3000); 
    }

     // --- Pending Quotes ---
    await page.locator('.sidebar').getByText('Jobs', { exact: true }).click();
    await page.locator('.sidebar').getByRole('link', { name: 'Pending Quotes' }).click();
    await page.waitForLoadState('networkidle');
    await expect(userProfile).toBeVisible({ timeout: 30000 });
    
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