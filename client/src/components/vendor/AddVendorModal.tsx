import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  X,
  Loader2,
  Building2,
  Mail,
  Phone,
  User
} from "lucide-react";

const addVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type AddVendorForm = z.infer<typeof addVendorSchema>;

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVendor: (data: AddVendorForm) => void;
  isAdding: boolean;
}

export function AddVendorModal({ 
  isOpen, 
  onClose, 
  onAddVendor, 
  isAdding 
}: AddVendorModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<AddVendorForm>({
    resolver: zodResolver(addVendorSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      notes: '',
    }
  });

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: AddVendorForm) => {
    onAddVendor(data);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-0 border w-full max-w-2xl shadow-lg rounded-lg bg-white m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Add New Vendor</h3>
              <p className="text-sm text-gray-600">Add a new 1099 contractor to your system</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vendor Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Vendor Name *</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter vendor/company name"
                className={errors.name ? 'border-red-300' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email Address *</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="vendor@example.com"
                className={errors.email ? 'border-red-300' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone" className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Phone Number (Optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="(555) 123-4567"
                className="md:w-1/2"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Any additional notes about this vendor..."
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding Vendor...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Add Vendor
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}