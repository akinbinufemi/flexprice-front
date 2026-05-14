/* eslint-disable i18next/no-literal-string -- Demo-only illustrative UI copy */
import React, { useState } from 'react';
import CustomPopover from './CustomPopover';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Settings, Info, User } from 'lucide-react';

/**
 * Demo component showcasing different ways to use the CustomPopover component
 */
const CustomPopoverDemo: React.FC = () => {
	// Example of controlled popover state
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

	return (
		<div className='space-y-8 p-6'>
			<h1 className='text-2xl font-bold'>CustomPopover Examples</h1>

			<div className='flex flex-col gap-8'>
				{/* Basic example */}
				<div>
					<h2 className='text-lg font-semibold mb-2'>Basic Button Trigger</h2>
					<CustomPopover trigger={<Button>Click Me</Button>}>
						<div className='p-2'>
							<p className='font-semibold'>Basic Popover</p>
							<p className='text-sm text-muted-foreground'>This is a simple popover with default settings.</p>
						</div>
					</CustomPopover>
				</div>

				{/* Icon trigger example */}
				<div>
					<h2 className='text-lg font-semibold mb-2'>Icon Trigger</h2>
					<CustomPopover
						trigger={
							<button className='p-2 rounded-full hover:bg-accent'>
								<Info className='h-5 w-5' />
							</button>
						}
						side='right'>
						<div className='p-2'>
							<p className='font-semibold'>Help Information</p>
							<p className='text-sm text-muted-foreground'>Icon triggers are great for help or info popovers.</p>
						</div>
					</CustomPopover>
				</div>

				{/* Custom styled example */}
				<div>
					<h2 className='text-lg font-semibold mb-2'>Custom Styled Popover</h2>
					<CustomPopover
						trigger={
							<Button variant='outline'>
								<User className='h-4 w-4 me-2' />
								Account
								<ChevronsUpDown className='h-4 w-4 ms-2' />
							</Button>
						}
						contentClassName='p-0 w-56'>
						<div className='flex flex-col'>
							<div className='p-3 border-b'>
								<p className='font-semibold'>User Profile</p>
								<p className='text-xs text-muted-foreground'>Manage your account settings</p>
							</div>
							<div className='p-1'>
								<button className='w-full text-start px-2 py-1.5 text-sm rounded hover:bg-accent'>Edit Profile</button>
								<button className='w-full text-start px-2 py-1.5 text-sm rounded hover:bg-accent'>Settings</button>
								<button className='w-full text-start px-2 py-1.5 text-sm rounded hover:bg-accent text-red-500'>Sign Out</button>
							</div>
						</div>
					</CustomPopover>
				</div>

				{/* Controlled state example */}
				<div>
					<h2 className='text-lg font-semibold mb-2'>Controlled Popover State</h2>
					<div className='flex items-center gap-4'>
						<CustomPopover
							trigger={
								<Button variant='outline'>
									<Settings className='h-4 w-4 me-2' />
									Settings
								</Button>
							}
							open={isSettingsOpen}
							onOpenChange={setIsSettingsOpen}>
							<div className='p-2'>
								<p className='font-semibold'>Settings Menu</p>
								<p className='text-sm text-muted-foreground mb-2'>This popover's state is controlled externally.</p>
								<Button size='sm' onClick={() => setIsSettingsOpen(false)}>
									Close
								</Button>
							</div>
						</CustomPopover>

						<Button variant='ghost' size='sm' onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
							{isSettingsOpen ? 'Close' : 'Open'} Settings
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CustomPopoverDemo;
