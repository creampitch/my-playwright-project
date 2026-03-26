import { test, expect } from '@playwright/test';

// 💡 พี่ถอด data.json ออกตามที่น้องบอก ให้กรอกสดตรง LOGIN นะครับ
test('สร้าง Job 3 ครั้งด้วย Automation', async ({ page }) => {
    test.setTimeout(600000);

    await page.goto('https://uat.thecoachcompany.co.uk/admin/');

    // Dialog handler
    page.on('dialog', async dialog => {
        console.log(`💬 Dialog: ${dialog.message()}`);
        await dialog.accept();
    });

    // LOGIN 
    await page.getByPlaceholder(/Username/i).fill('cream');
    await page.getByPlaceholder('Please enter Password', { exact: true }).fill('Zerothree03!');
    await page.getByRole('button', { name: 'LOG IN' }).click();
    const userProfile = page.locator('span').filter({ hasText: 'cream' }).first();
    await expect(userProfile).toBeVisible({ timeout: 30000 });
    console.log('✅ Login สำเร็จ');


    // LOOP START 
    for (let i = 1; i <= 5; i++) {
        console.log(`🚀 เริ่มสร้าง Job รอบที่ ${i}`);

        // ไปหน้า New Job
        await page.locator('.sidebar').getByText('Jobs', { exact: true }).click();
        await page.locator('.sidebar').getByRole('link', { name: 'New Job' }).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Profile
        const profileDropdown = page.getByRole('combobox').first();
        await profileDropdown.selectOption({ label: 'thecoachcompany.co.uk' });
        await page.waitForTimeout(3000);

        // Job Template
        const templateDropdown = page.getByRole('combobox').nth(1);
        await templateDropdown.selectOption({ label: 'Test' });
        await templateDropdown.dispatchEvent('change');
        await page.waitForTimeout(1500);
        console.log('✅ Template เลือกแล้ว');

        // Journey Type
        const journeyTypeDropdown = page.locator('#default_journey_id');
        await expect(async () => {
            const listContent = await journeyTypeDropdown.innerText();
            if (!listContent.includes('Automation Test')) {
                throw new Error('Data not arrived yet');
            }
        }).toPass({ timeout: 20000 });
        await journeyTypeDropdown.selectOption('78');
        console.log('✅ Journey Type OK');

        // Customer
        const companyInput = page.locator('#search_text');
        await companyInput.click();
        await companyInput.pressSequentially('Cream', { delay: 100 });
        const suggestionItem = page.locator('#jquery-live-search p').filter({ hasText: 'Cream (cream@voovadigital.com)' }).first();
        await suggestionItem.waitFor({ state: 'visible', timeout: 10000 });
        await suggestionItem.click();
        await page.keyboard.press('Enter');
        console.log('✅ เลือกลูกค้าแล้ว');

        // Auto fill check
        const emailInput = page.locator('#email');
        await expect(async () => {
            const emailVal = await emailInput.inputValue();
            if (!emailVal) {
                throw new Error('customer not loaded');
            }
        }).toPass({ timeout: 10000 });
        console.log('🎉 Customer Autofill OK');

        // Transport
        console.log(`🚌 [รอบ ${i}] กำลังเลือกรายละเอียดรถ...`);
        await page.locator('#default_num_id').selectOption({ label: '1 Pax' });
        await page.locator('#default_num_vehicle').selectOption({ label: '1 vehicle' });
        await page.locator('#default_car_id').selectOption({ label: 'Not Confirm' });

        // จัดการ Alert "Do you want to change?"
        const swalConfirm = page.locator('.swal2-confirm');
        if (await swalConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
            await swalConfirm.click();
            await page.locator('.swal2-container').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => { });
        }
        await page.waitForTimeout(1000);
        await page.locator('#default_bag_id').selectOption({ label: 'No luggage.' });

        // Price
        const vehiclePriceInput = page.locator('#price');
        await vehiclePriceInput.fill('100');
        await vehiclePriceInput.press('Tab');
        await page.waitForTimeout(1000);

        // Misc Settings
        const miscSettings = [
            { id: 'know_where', value: 'Comfy Coaches Website' },
            { id: 'opsperson', value: 'cream intern' },
            { id: 'salesperson2', value: 'cream intern' },
            { id: 'priority', value: '3' }
        ];
        for (const item of miscSettings) {
            const selectLocator = page.locator(`select#${item.id}`);
            await selectLocator.selectOption({ label: item.value });
            await selectLocator.dispatchEvent('change');
            await page.waitForTimeout(300);
        }

        // Date & Time (Pickup 1)
        const mainTable = page.locator('table').filter({ hasText: 'Pickup date' });
        await mainTable.locator('.fa-calendar').first().click();
        const datePicker = page.locator('.datepicker').last();
        await datePicker.locator('.datepicker-switch').filter({ visible: true }).first().click();
        await page.waitForTimeout(500);
        await datePicker.locator('.datepicker-switch').filter({ visible: true }).first().click();
        await datePicker.getByText('2030', { exact: true }).click();
        await datePicker.locator('.month').filter({ hasText: /^Jan$/ }).click();
        await datePicker.locator('td.day:not(.old):not(.new)').filter({ hasText: /^3$/ }).click();

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
        console.log('➕ คลิก Add Movement...');
        await page.getByRole('button', { name: ' Add Movement' }).click({ force: true });
        const currentRow2 = page.locator('tr').filter({ hasText: 'Collection Address(2)' });
        const collectionInput2 = page.locator('input[name="collection_address[]"]').nth(1);
        await collectionInput2.waitFor({ state: 'visible' });

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

        // Save and Send
        await page.getByRole('button', { name: /Save and Send/i }).first().click({ force: true });
        const emailModal = page.locator('.modal.in').filter({ hasText: /New Email/i });
        await emailModal.waitFor({ state: 'visible' });
        await emailModal.locator('#subject, input[name="subject"]').first().fill(`Automated Job Round ${i} - 2 Movements`);
        await page.frameLocator('iframe[title*="singleText"]').locator('body').fill(`Automated test round ${i}`);
        await emailModal.getByRole('button', { name: 'Save and Send Job' }).click({ force: true });

        // Job ID Verification
        const jobIdLocator = page.locator('h3').filter({ hasText: /^\d{5,7}/ }).first();
        await jobIdLocator.waitFor({ state: 'visible', timeout: 45000 });
        const jobId = (await jobIdLocator.innerText()).match(/\d+/)[0];
        console.log(`🎉 รอบที่ ${i} สำเร็จ! Job ID: ${jobId}`);
        await page.screenshot({ path: `job-${i}-${jobId}.png`, fullPage: true });
        await page.waitForTimeout(3000);
    }
});