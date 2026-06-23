'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import sql from '@/app/lib/db';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status'
  }),
  date: z.string(),
});

const invoicesPath = '/dashboard/invoices';
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });


export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData){
    const rawFormData = Object.fromEntries(formData.entries());
    const validatedFields = CreateInvoice.safeParse(rawFormData);
    
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }
    
    const validFormData = CreateInvoice.parse(rawFormData);
    
    const amountInCents = validFormData.amount * 100;
    const date = new Date().toISOString().split('T')[0];
    
    try{
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${validFormData.customerId}, ${amountInCents}, ${validFormData.status}, ${date})
        `;
    } catch(e){
        console.error(e);
        return{
            message: 'Database Error: Failed to Create Invoice'
        };
    }
    revalidatePath(invoicesPath);
    redirect(invoicesPath);
}


export async function updateInvoice(id: string, prevState: State, formData: FormData) {
    const rawFormData = Object.fromEntries(formData.entries());
    const validatedFields = UpdateInvoice.safeParse(rawFormData);
    
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    } 

    const validFormData = UpdateInvoice.parse(rawFormData);
    const amountInCents = validFormData.amount * 100;
 
    try{
    await sql`
        UPDATE invoices
        SET customer_id = ${validFormData.customerId}, amount = ${amountInCents}, status = ${validFormData.status}
        WHERE id = ${id}
    `;
    } catch(e){
        console.error(e);
        return {
            message: 'Database Error: Failed to Update Invoice'
        }
    }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try{
      await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch(e){
    console.error(e);
    return{
        message:'Database Error: Failed to Delete Invoice'
    }
  }
  revalidatePath('/dashboard/invoices');
}