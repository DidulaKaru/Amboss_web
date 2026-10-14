export interface NewsItem {
  id: number;
  anchorId: string;
  title: string;
  summary: string;
  imageUrl: string;
  content: string;
}

export const newsItems: NewsItem[] = [
  {
    id: 1,
    anchorId: 'news-1',
    title: 'Rextro Exhibition',
    summary: 'Amboss showcased multiple innovative projects at Rextro 2025.',
    imageUrl: `${import.meta.env.BASE_URL}images/rextro_crop.jpg`,
    content:
      'Amboss shined at the Rextro Exhibition, presenting a selection of precision-engineered prototypes, rapid-manufacturing workflows, and collaborative design processes. The showcase highlighted our end-to-end capability—from concept to production—while engaging with partners and students to foster innovation in engineering.',
  },
  {
    id: 2,
    anchorId: 'news-2',
    title: 'Rextro Souvenir',
    summary: 'Limited-run custom souvenirs manufactured for the Silver Jubilee of the Faculty of Engineering.',
    imageUrl: `${import.meta.env.BASE_URL}images/souvenir_crop.jpg`,
    content:
      'To commemorate the Rextro Exhibition, Amboss designed and manufactured a limited series of custom souvenirs. Designed for durability and precise detail, these items demonstrate our craftsmanship and small-batch manufacturing discipline, including robust QA workflows and elegant finishing.',
  },
  {
    id: 3,
    anchorId: 'news-3',
    title: 'Falcon 9 Pen',
    summary: 'Bringing a history defining rocket on to your desk.',
    imageUrl: `${import.meta.env.BASE_URL}images/falcon9.jpg`,
    content:
      'Designed and Manufactured by Amboss for SEDS Ruhuna chapter. Inspired by aerospace engineering, the Falcon 9 pen blends performance, ergonomics, and style. Crafted with precision 3D printing and high-quality materials, it offers a smooth writing experience while celebrating the spirit of innovation and exploration.',
  },
  {
    id: 4,
    anchorId: 'news-4',
    title: 'Disaster Relief',
    summary: 'Giving back to the community in times of need.',
    imageUrl: `${import.meta.env.BASE_URL}images/disaster_relief.jpg`,
    content:
      'Amboss was able to contribute to disaster relief efforts in the aftermath of cyclone Ditwah by donating critical aid - including food, sanitary items, and medical supplies - to affected communities in Gampola. We are committed to supporting our community and standing together in times of crisis.',
  },
  {
    id: 5,
    anchorId: 'news-5',
    title: 'Amboss at University of Vavuniya',
    summary: 'Showcasing our projects at the opening ceremony of the VALID center in University of Vavuniya',
    imageUrl: `${import.meta.env.BASE_URL}images/Vavuniya.jpg`,
    content:
      'We were honored to be invited to the opening ceremony of the Center for Verification of Accuracy and Learning for Innovation and Development at the University of Vavuniya to showcase our projects in biomedical engineering.',
  },
]
