import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';

export async function handleIllustrationUpload(file: File): Promise<string> {
	const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
	const filename = `${nanoid()}.${ext}`;
	const uploadDir = join(process.cwd(), 'static', 'uploads', 'movements');

	await mkdir(uploadDir, { recursive: true });
	const filepath = join(uploadDir, filename);
	const bytes = await file.arrayBuffer();
	await writeFile(filepath, Buffer.from(bytes));

	return `/uploads/movements/${filename}`;
}

export async function deleteIllustration(illustrationPath: string): Promise<void> {
	try {
		const filepath = join(process.cwd(), 'static', illustrationPath);
		await unlink(filepath);
	} catch (e) {
		console.error('Failed to delete illustration:', e);
	}
}
