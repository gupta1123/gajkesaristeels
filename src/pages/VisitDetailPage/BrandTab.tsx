import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash, CheckCircle, XCircle } from "lucide-react";

type Brand = {
    id: number;
    brandName: string;
    pros: string[];
    cons: string[];
};

type NewBrand = {
    brandName: string;
    pros: string[];
    cons: string[];
};

interface BrandTabProps {
    brands: Brand[];
    setBrands: React.Dispatch<React.SetStateAction<Brand[]>>;
    visitId: string;
    token: string | null;
    fetchVisitDetail: (visitId: string) => Promise<void>;
}

export default function BrandTab({ brands, setBrands, visitId, token, fetchVisitDetail }: BrandTabProps) {
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [newBrand, setNewBrand] = useState<NewBrand>({
        brandName: "",
        pros: [],
        cons: [],
    });
    const [editingBrandId, setEditingBrandId] = useState<number | null>(null);

    const fetchBrands = useCallback(async () => {
        try {
            const response = await fetch(`https://api.gajkesaristeels.in/visit/getProCons?visitId=${visitId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            const brandsData: Brand[] = data?.map((brand: any) => ({
                id: brand.id,
                brandName: brand.brandName,
                pros: brand.pros,
                cons: brand.cons,
            })) || [];
            setBrands(brandsData);
        } catch (error) {
            console.error("Error fetching brands:", error);
        }
    }, [token, visitId, setBrands]);

    useEffect(() => {
        if (visitId) {
            fetchBrands();
        }
    }, [visitId, fetchBrands]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewBrand({ ...newBrand, [e.target.name]: e.target.value });
    };

    const handleAddProCon = (type: "pros" | "cons") => {
        if (newBrand[type].length < 3) {
            setNewBrand({
                ...newBrand,
                [type]: [...newBrand[type], ""],
            });
        }
    };

    const handleProConChange = (
        type: "pros" | "cons",
        index: number,
        value: string
    ) => {
        const updatedProCon = [...newBrand[type]];
        updatedProCon[index] = value;
        setNewBrand({ ...newBrand, [type]: updatedProCon });
    };

    const handleAddBrand = async () => {
        if (newBrand.brandName.trim() !== "") {
            const brand = {
                brandName: newBrand.brandName,
                pros: newBrand.pros.filter((pro) => pro.trim() !== ""),
                cons: newBrand.cons.filter((con) => con.trim() !== ""),
            };

            try {
                const response = await fetch(`https://api.gajkesaristeels.in/visit/addProCons?visitId=${visitId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify([...brands, brand]),
                });

                if (response.ok) {
                    setBrands([...brands, { ...brand, id: new Date().getTime() }]); // Assign a temporary id
                    setNewBrand({ brandName: "", pros: [], cons: [] });
                    setIsAdding(false);
                } else {
                    console.error("Error adding brand:", response.statusText);
                }
            } catch (error) {
                console.error("Error adding brand:", error);
            }
        }
    };

    const handleEditBrand = (brandId: number) => {
        setIsEditing(true);
        setEditingBrandId(brandId);
        const brand = brands.find((b) => b.id === brandId);
        if (brand) {
            setNewBrand({
                brandName: brand.brandName,
                pros: brand.pros,
                cons: brand.cons,
            });
        } else {
            console.error("Brand not found");
        }
    };

    const handleUpdateBrand = async () => {
        if (newBrand.brandName.trim() !== "") {
            const updatedBrands = brands.map((brand) => {
                if (brand.id === editingBrandId) {
                    return {
                        ...brand,
                        brandName: newBrand.brandName,
                        pros: newBrand.pros.filter((pro) => pro.trim() !== ""),
                        cons: newBrand.cons.filter((con) => con.trim() !== ""),
                    };
                }
                return brand;
            });

            try {
                const response = await fetch(`https://api.gajkesaristeels.in/visit/addProCons?visitId=${visitId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(updatedBrands.map((brand) => ({
                        brandName: brand.brandName,
                        pros: brand.pros,
                        cons: brand.cons,
                    }))),
                });

                if (response.ok) {
                    setBrands(updatedBrands);
                    setNewBrand({ brandName: "", pros: [], cons: [] });
                    setIsEditing(false);
                    setEditingBrandId(null);
                } else {
                    console.error("Error updating brand:", response.statusText);
                }
            } catch (error) {
                console.error("Error updating brand:", error);
            }
        }
    };

    const handleDeleteBrand = async (id: number) => {
        const deletedBrand = brands.find((brand) => brand.id === id);
        const updatedBrands = brands.filter((brand) => brand.id !== id);

        if (deletedBrand) {
            try {
                const response = await fetch(`https://api.gajkesaristeels.in/visit/deleteProCons?visitId=${visitId}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify([{ brandName: deletedBrand.brandName }]),
                });

                if (response.ok) {
                    setBrands(updatedBrands);
                    console.log("Pros Cons Deleted Successfully!");
                } else {
                    console.error("Error deleting brand:", response.statusText);
                }
            } catch (error) {
                console.error("Error deleting brand:", error);
            }
        }
    };

    return (
        <div className="w-full">
            {!isAdding && !isEditing && brands && brands.length === 0 && (
                <div className="text-center">
                    <p className="text-gray-500">No brands available.</p>
                    <Button onClick={() => setIsAdding(true)} className="mt-4">
                        <Plus className="mr-2" />
                        Add Brand
                    </Button>
                </div>
            )}

            {(isAdding || isEditing) && (
                <Card className="w-full mb-4 p-4">
                    <CardContent>
                        <div className="mb-4">
                            <Label>Brand Name</Label>
                            <Input
                                name="brandName"
                                value={newBrand.brandName}
                                onChange={handleInputChange}
                                placeholder="Enter brand name"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <Label>Pros</Label>
                                {newBrand.pros.map((pro, index) => (
                                    <Input
                                        key={index}
                                        value={pro}
                                        onChange={(e) => handleProConChange("pros", index, e.target.value)}
                                        placeholder={`Pro ${index + 1}`}
                                        className="mb-2"
                                    />
                                ))}
                                {newBrand.pros.length < 3 && (
                                    <Button
                                        onClick={() => handleAddProCon("pros")}
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                    >
                                        <Plus className="mr-2" />
                                        Add Pro
                                    </Button>
                                )}
                            </div>
                            <div>
                                <Label>Cons</Label>
                                {newBrand.cons.map((con, index) => (
                                    <Input
                                        key={index}
                                        value={con}
                                        onChange={(e) => handleProConChange("cons", index, e.target.value)}
                                        placeholder={`Con ${index + 1}`}
                                        className="mb-2"
                                    />
                                ))}
                                {newBrand.cons.length < 3 && (
                                    <Button
                                        onClick={() => handleAddProCon("cons")}
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                    >
                                        <Plus className="mr-2" />
                                        Add Con
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                onClick={isEditing ? handleUpdateBrand : handleAddBrand}
                                variant="default"
                            >
                                {isEditing ? "Update" : "Add"}
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsAdding(false);
                                    setIsEditing(false);
                                    setEditingBrandId(null);
                                    setNewBrand({ brandName: "", pros: [], cons: [] });
                                }}
                                variant="outline"
                            >
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {brands.length > 0 && (
                <div className="mt-8 grid grid-cols-1 gap-4">
                    {brands.map((brand) => (
                        <Card key={brand.id} className="w-full p-4 bg-white rounded-lg shadow-md flex justify-between items-center">
                            <CardContent className="w-full">
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <div className="font-bold text-lg" style={{ color: '#3490dc' }}>{brand.brandName}</div>

                                        <div className="flex items-center mt-2">
                                            <div className="mr-4">
                                                <div className="font-semibold mb-1 flex items-center">
                                                    <CheckCircle className="text-green-500 mr-1" />
                                                    Pros
                                                </div>
                                                <ul className="text-gray-600 text-sm list-disc pl-4">
                                                    {brand.pros.map((pro, index) => (
                                                        <li key={index}>{pro}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <div className="font-semibold mb-1 flex items-center">
                                                    <XCircle className="text-red-500 mr-1" />
                                                    Cons
                                                </div>
                                                <ul className="text-gray-600 text-sm list-disc pl-4">
                                                    {brand.cons.map((con, index) => (
                                                        <li key={index}>{con}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={() => handleEditBrand(brand.id)}
                                            variant="ghost"
                                            size="sm"
                                        >
                                            <Edit className="text-gray-500" />
                                        </Button>
                                        <Button
                                            onClick={() => handleDeleteBrand(brand.id)}
                                            variant="ghost"
                                            size="sm"
                                        >
                                            <Trash className="text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {!isAdding && !isEditing && (
                <Button onClick={() => setIsAdding(true)} className="mt-4">
                    <Plus className="mr-2" />
                    Add Brand
                </Button>
            )}
        </div>
    );
}
