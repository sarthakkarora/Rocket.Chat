
import { ILivechatDepartment } from '@rocket.chat/core-typings';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelAgents } from '../page-objects';
import { createDepartment, deleteDepartment } from '../utils/omnichannel/departments';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('omnichannel-agents', () => {
	let poOmnichannelAgents: OmnichannelAgents;

	let department: ILivechatDepartment;

	
	test.beforeEach(async ({ api, page }) => {
		poOmnichannelAgents = new OmnichannelAgents(page);
		await page.goto('/omnichannel');
		await poOmnichannelAgents.sidenav.linkAgents.click();
		const res = await createDepartment(api);

		await expect(res.status()).toBe(200);

		({ department } = await res.json())
	});

	test.afterEach(async ({ api }) => {
		// Ensure that there is no leftover data even if test fails
		await api.delete('/livechat/users/agent/user1');
		await api.post('/settings/Omnichannel_enable_department_removal', { value: true }).then((res) => expect(res.status()).toBe(200));
		await deleteDepartment(api, { id: department._id });
		await api.post('/settings/Omnichannel_enable_department_removal', { value: false }).then((res) => expect(res.status()).toBe(200));
	});

	test('OC - Manage Agents - Add, search and remove using table', async ({ page }) => {
		await test.step('expect "user1" be first ', async () => {
			await poOmnichannelAgents.inputUsername.type('user');
			await expect(page.locator('role=option[name="user1"]')).toContainText('user1');

			await poOmnichannelAgents.inputUsername.type('');
		});

		await test.step('expect add "user1" as agent', async () => {
			await poOmnichannelAgents.inputUsername.type('user1');
			await page.locator('role=option[name="user1"]').click();
			await poOmnichannelAgents.btnAdd.click();

			await poOmnichannelAgents.inputSearch.fill('user1');
			await expect(poOmnichannelAgents.firstRowInTable).toBeVisible();
			await expect(poOmnichannelAgents.firstRowInTable).toContainText('user1');
		});

		await test.step('expect remove "user1" as agent', async () => {
			await poOmnichannelAgents.inputSearch.fill('user1');
			await poOmnichannelAgents.btnDeletefirstRowInTable.click();
			await poOmnichannelAgents.btnModalRemove.click();

			await poOmnichannelAgents.inputSearch.fill('user1');
			await expect(poOmnichannelAgents.firstRowInTable).toBeHidden();
		});
	});

	test('OC - [CE] Manage Agents - Edit and Remove', async ({ page }) => {
		test.skip(IS_EE, 'Community Edition Only');

		await poOmnichannelAgents.inputUsername.type('user1');
		await page.locator('role=option[name="user1"]').click();
		await poOmnichannelAgents.btnAdd.click();

		await poOmnichannelAgents.inputSearch.fill('user1');
		await poOmnichannelAgents.firstRowInTable.click();
		await poOmnichannelAgents.btnEdit.click();

		await test.step('expect max chats fields to be hidden', async () => {
			await expect(poOmnichannelAgents.inputMaxChats).toBeHidden();
		});

		await test.step('expect update "user1" information', async () => {
			await poOmnichannelAgents.selectStatus.click();
			await page.locator(`.rcx-option__content:has-text("Not available")`).click();
			await poOmnichannelAgents.selectDepartment.click();
			await page.locator(`.rcx-option__content:has-text("${department.name}")`).click();
			await poOmnichannelAgents.btnSave.click();
		});
		
		await test.step('expect removing "user1" via sidebar', async () => {
			await poOmnichannelAgents.inputSearch.fill('user1');
			await poOmnichannelAgents.firstRowInTable.click();
			await poOmnichannelAgents.btnRemove.click();
		});
	});

	test('OC - [EE] Manage Agents - Edit ', async ({ page }) => {
		test.skip(!IS_EE, 'Enterprise Only');

		await poOmnichannelAgents.inputUsername.type('user1');
		await page.locator('role=option[name="user1"]').click();
		await poOmnichannelAgents.btnAdd.click();

		await poOmnichannelAgents.inputSearch.fill('user1');
		await poOmnichannelAgents.firstRowInTable.click();
		await poOmnichannelAgents.btnEdit.click();

		await test.step('expect max chats field to be visible', async () => {
			await expect(poOmnichannelAgents.inputMaxChats).toBeVisible();
		});

		await test.step('expect update "user1" information', async () => {
			await poOmnichannelAgents.inputMaxChats.click();
			await poOmnichannelAgents.inputMaxChats.fill('2');
			await poOmnichannelAgents.btnSave.click();

		});
	});
});