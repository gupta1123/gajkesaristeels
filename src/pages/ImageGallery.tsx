import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import Image from 'next/image';

interface ImageGalleryProps {
    images: string[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
    return (
        <Carousel
            showThumbs={true}
            thumbWidth={80}
            renderThumbs={() =>
                images.map((image, index) => (
                    <div key={index} style={{ position: 'relative', width: '80px', height: '60px' }}>
                        <Image
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            layout="fill"
                            objectFit="cover"
                        />
                    </div>
                ))
            }
        >
            {images.map((image, index) => (
                <div key={index} style={{ position: 'relative', width: '300px', height: '200px' }}>
                    <Image
                        src={image}
                        alt={`Image ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                    />
                </div>
            ))}
        </Carousel>
    );
};

export default ImageGallery;
