"use client";

import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type Category = {
  id: string;
  name: string;
  prefix: string;
  custom_attributes: string[]; // Mocking JSON schema as a simple array of string fields for now
};

// Mock data for initial UI build
const initialCategories: Category[] = [
  { id: "1", name: "Laptops", prefix: "LAP", custom_attributes: ["OS", "RAM", "Processor"] },
  { id: "2", name: "Vehicles", prefix: "VEH", custom_attributes: ["License Plate", "Fuel Type"] },
  { id: "3", name: "Furniture", prefix: "FUR", custom_attributes: ["Material", "Color"] },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Form State
  const [catName, setCatName] = useState("");
  const [catPrefix, setCatPrefix] = useState("");
  const [catAttributes, setCatAttributes] = useState("");
  const { toast } = useToast();

  const handleOpenDialog = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatPrefix(cat.prefix);
      setCatAttributes(cat.custom_attributes.join(", "));
    } else {
      setEditingCategory(null);
      setCatName("");
      setCatPrefix("");
      setCatAttributes("");
    }
    setIsDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!catName || !catPrefix) return;

    const parsedAttributes = catAttributes.split(",").map(a => a.trim()).filter(a => a);

    if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, name: catName, prefix: catPrefix, custom_attributes: parsedAttributes } : c));
      toast({ title: "Category updated successfully" });
    } else {
      const newCategory: Category = {
        id: Math.random().toString(),
        name: catName,
        prefix: catPrefix,
        custom_attributes: parsedAttributes,
      };
      setCategories([...categories, newCategory]);
      toast({ title: "Category added successfully" });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
    toast({ title: "Category deleted", variant: "destructive" });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category Name</label>
                  <Input 
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Laptops"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tag Prefix</label>
                  <Input 
                    value={catPrefix}
                    onChange={(e) => setCatPrefix(e.target.value.toUpperCase())}
                    placeholder="e.g. LAP"
                    required
                    maxLength={4}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Attributes (Comma Separated)</label>
                <Input 
                  value={catAttributes}
                  onChange={(e) => setCatAttributes(e.target.value)}
                  placeholder="e.g. OS, RAM, Processor"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prefix</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Custom Attributes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-mono font-medium">{cat.prefix}-XXXX</TableCell>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {cat.custom_attributes.length > 0 ? (
                          cat.custom_attributes.map((attr, i) => (
                            <span key={i} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                              {attr}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(cat)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(cat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
