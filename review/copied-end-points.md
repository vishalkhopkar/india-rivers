# Rivers whose start and end are recorded as one point

In the CWC data these 60 rivers have the same coordinates for their start (`st_pt`) and end (`en_pt`), and the end-location names (`en_loc_*`) repeat the start ones. Found 2026-10-02 while fixing the Khari in Gujarat, which had no link to the Sabarmati because of it.

The copied value can be either end, so `scripts/03a-topology.mjs` now tries both ends of the line and takes as the mouth whichever sits nearer the river named in `Confluence`. For rivers that end in the sea, at a border or inland there is no river to test against, so the recorded point is assumed to be the source. For these rivers the map also doesn't infer "Branched off from", because which end is the source was a judgement call.

**Columns:** *Copied point is the* - which end the duplicated coordinate turned out to be. *Flows into* - the river it now links to ("not linked" means the named river is still too far from either end, or the link was dropped to break a loop of rivers that each claim to flow into the other). *New link* - linked only since this fix. *Origin* and *Mouth* - the place descriptions now shown in the panel.

**Worth checking by hand:** rows marked "source (assumed)", the not-linked ones, and the Himalayan streams whose other end lies on a big river (Binno Khad and Beas Kund touch the Beas, Kirang Khad the Satluj), where it is unclear which end is the source.

| UID | River | State | Length | Flows into | Copied point is the | New link | Origin | Mouth |
|---|---|---|---|---|---|---|---|---|
| 19186 | Barak River | Assam,Manipur,Mizoram,Nagaland | 541.7 km | Bangladesh (border) | source (assumed) |  | Naga Hills near Mao, Senapati district, Manipur | Near Karimganj, Assam, where it splits into the Surma and Kushiyara |
| 30084 | Dhimra Dhar | Bihar | 17.5 km | Beharwa | mouth |  | 20 km W of Bhawanipur, Bihar | 25 km NE of Supaul, Bihar |
| 2253 | Khari | Gujarat | 173.5 km | Sabarmati | source | yes | Himatnagar, Gujarat | Vautha, south of Ahmedabad, Gujarat |
| 11788 | Beas Kund | Himachal Pradesh | 12.1 km | Kund (not linked) | mouth |  | Himalayas near Manali, Himachal Pradesh | Manali, Himachal Pradesh |
| 11871 | Binno Khad | Himachal Pradesh | 20.4 km | Awa Khad | mouth |  | Himalayas, 17 km E of Tira Sujanpur, Himachal Pradesh | Jogindarnagar, Himachal Pradesh |
| 11919 | Brauhokri Khad | Himachal Pradesh | 7.1 km | Banthal Khad | mouth |  | Himalayas, 18 km SE of Sundarnagar, Himachal Pradesh | 35 km N of Shimla, Himachal Pradesh |
| 12409 | Dlauli | Himachal Pradesh | 5.7 km | Dodu Da Nal | mouth |  | Himalayas near Bhadarwah, Jammu and Kashmir | 17 km SE of Bhadarwah, Jammu and Kashmir |
| 15820 | Khera Di Khad | Himachal Pradesh | 9.4 km | Surarwah Khad | mouth |  | 20 km SE of Pathankot, Punjab | 20 km SE of Pathankot, Punjab |
| 13365 | Kirang Khad | Himachal Pradesh | 6.1 km | Talti Garang | mouth |  | Himalayas, 100 km N of Uttarkashi, Uttarakhand | 80 km NE of Rohru, Himachal Pradesh |
| 13703 | Mahid Khad | Himachal Pradesh | 5.1 km | Beas River | source |  | Himalayas near Shamshi, Himachal Pradesh | Kullu, Himachal Pradesh |
| 14139 | Oj Khad | Himachal Pradesh | 11.5 km | Barhy Khad | mouth |  | Himalayas near Nagrota Bagwan, Himachal Pradesh | Kangra, Himachal Pradesh |
| 14964 | Sorad Khad | Himachal Pradesh | 2.8 km | Kandi Khad | mouth |  | Himalayas, 16 km SE of Sundarnagar, Himachal Pradesh | Sundarnagar, Himachal Pradesh |
| 15022 | Sukkar Khad | Himachal Pradesh | 8.4 km | Rana Khad | mouth |  | Himalayas near Jogindarnagar, Himachal Pradesh | Jogindarnagar, Himachal Pradesh |
| 15543 | Markanda | Himachal Pradesh,Haryana,Punjab | 160.6 km | Ghagghar | source | yes | Nahan, Himachal Pradesh | Chika, Haryana |
| 11570 | Apan | Jammu & Kashmir | 12.4 km | Maru Sudar | source | yes | 90 km E of Srinagar, Jammu and Kashmir | 95 km SE of Srinagar, Jammu and Kashmir |
| 12670 | Gorasang | Jammu & Kashmir | 5.1 km | Gahan | mouth |  | Himalayas near Bunjwah, Jammu and Kashmir | Bunjwah, Jammu and Kashmir |
| 15779 | Krash Nai | Jammu & Kashmir | 21.5 km | Tanak (not linked) | mouth |  | 65 km E of Anantnag, Jammu and Kashmir | 80 km E of Anantnag, Jammu and Kashmir |
| 14245 | Paranshur N | Jammu & Kashmir | 5.3 km | Makalwain | mouth |  | 60 km NE of Srinagar, Jammu and Kashmir | 60 km NE of Srinagar, Jammu and Kashmir |
| 14412 | Railpawas | Jammu & Kashmir | 4.8 km | Kaznal | mouth |  | 30 km E of Anantnag, Jammu and Kashmir | 25 km E of Anantnag, Jammu and Kashmir |
| 15081 | Suthaun Ra Nal | Jammu & Kashmir | 6.4 km | Khabbi Da Nal (not linked) | mouth |  | Himalayas, 55 km N of Pathankot, Punjab | 60 km N of Pathankot, Punjab |
| 15768 | Thana Nal | Jammu & Kashmir | 7.2 km | Dohaggi Nal (not linked) | mouth |  | 17 km N of Doda, Jammu and Kashmir | 17 km N of Doda, Jammu and Kashmir |
| 15482 | Zaji Nai | Jammu & Kashmir | 19.3 km | Reni | source | yes | 90 km E of Srinagar, Jammu and Kashmir | 65 km E of Anantnag, Jammu and Kashmir |
| 9798 | Puzhackal | Kerala | 27.6 km | Arabian Sea (sea) | source (assumed) |  | Minalur, Kerala | Venkidanga, Kerala |
| 11942 | Bukdang Phu | Ladakh | 12.8 km | Shyok River | source |  | Karakoram, 25 km E of Thang, Ladakh | 25 km SE of Thang, Ladakh |
| 12037 | Chanspo Tokpo | Ladakh | 19.4 km | Lung Yogma (not linked) | source |  | 80 km SE of Leh, Ladakh | 70 km SE of Leh, Ladakh |
| 12236 | Chumesang | Ladakh | 7.7 km | Lubang Yogma | mouth |  | Ladakh | Ladakh |
| 12452 | Dras | Ladakh | 41.3 km | Shingo | source | yes | 95 km NE of Srinagar, Jammu and Kashmir | Kargil, Ladakh |
| 15755 | Kyammar Lungpa | Ladakh | 5.0 km | Mundar Tokpo | source | yes | Himalayas, 70 km S of Leh, Ladakh | 65 km S of Leh, Ladakh |
| 15733 | Lung Yogma | Ladakh | 18.3 km | Chanspo Tokpo | mouth |  | 55 km E of Leh, Ladakh | 70 km SE of Leh, Ladakh |
| 14152 | Pachalung N | Ladakh | 5.5 km | Naibokhar | mouth |  | Himalayas, 85 km SE of Leh, Ladakh | 90 km SE of Leh, Ladakh |
| 14253 | Parma Tokpo | Ladakh | 10.3 km | Chanspo Tokpo | source | yes | 90 km SE of Leh, Ladakh | 80 km SE of Leh, Ladakh |
| 14328 | Phuchha Gungma | Ladakh | 15.8 km | Indus River | source |  | 65 km SE of Leh, Ladakh | 60 km SE of Leh, Ladakh |
| 14751 | Shain Tokpo | Ladakh | 4.8 km | Dat Tokpo | mouth |  | Himalayas, 55 km E of Padam, Ladakh | 60 km E of Padam, Ladakh |
| 15036 | Sumdo Lungma | Ladakh | 2.3 km | Karche or Sura | source |  | 40 km S of Kargil, Ladakh | 40 km S of Kargil, Ladakh |
| 15307 | Tongtingkongma Lungpa | Ladakh | 4.6 km | Lai Lungpa | mouth |  | 90 km SE of Leh, Ladakh | 85 km SE of Leh, Ladakh |
| 15565 | Chandbhan Drain | Punjab | 57.8 km | Malaut Drain | mouth |  | Badhni Kalan, Punjab | Jaito, Punjab |
| 14229 | Panjwar Drain | Punjab | 27.6 km | Chhichhrewal Drain | mouth |  | Amritsar, Punjab | 25 km SW of Amritsar, Punjab |
| 14411 | Raikot Link Drain | Punjab | 21.0 km | Bassian Outfall Drain | source | yes | 20 km SW of Ludhiana, Punjab | Raikot, Punjab |
| 7478 | Pandiyar | Tamil Nadu | 12.3 km | Koraiyar | mouth |  | Thiruthuraipoondi, Tamil Nadu | Thiruthuraipoondi, Tamil Nadu |
| 21024 | Aghariyabir | Uttar Pradesh | 13.6 km | Lamui Nala | mouth |  | 40 km E of Varanasi, Uttar Pradesh | Zamania, Uttar Pradesh |
| 21199 | Ari Nala | Uttar Pradesh | 83.5 km | Aril | mouth |  | 17 km SW of Moradabad, Uttar Pradesh | 18 km E of Chanduasi, Uttar Pradesh |
| 21267 | Babai Nala | Uttar Pradesh | 33.6 km | Soti | mouth |  | 18 km NW of Nanpara, Uttar Pradesh | 19 km NW of Nanpara, Uttar Pradesh |
| 21604 | Bandi Drain | Uttar Pradesh | 3.3 km | Rustamgarh Ramnagar Drain | mouth |  | Etah, Uttar Pradesh | Etah, Uttar Pradesh |
| 21660 | Banrua Nala | Uttar Pradesh | 15.1 km | Bagha | mouth |  | Pachperwa, Uttar Pradesh | Pachperwa, Uttar Pradesh |
| 29942 | Dundra | Uttar Pradesh | 13.3 km | Sohelwa Nala | mouth |  | Tulsipur, Uttar Pradesh | Balrampur, Uttar Pradesh |
| 24238 | Gurdangauri K | Uttar Pradesh | 5.1 km | Gobrahwa Nala | mouth |  | 25 km N of Bhinga, Uttar Pradesh | 20 km N of Bhinga, Uttar Pradesh |
| 25672 | Kheri Maniyar Drain | Uttar Pradesh | 11.1 km | Ikla Drain | mouth |  | Mawana, Uttar Pradesh | Mawana, Uttar Pradesh |
| 26179 | Lamui Nala | Uttar Pradesh | 4.8 km | Ganga River | mouth |  | Zamania, Uttar Pradesh | Zamania, Uttar Pradesh |
| 26828 | Nagan | Uttar Pradesh | 6.9 km | Kali River | mouth |  | Khatauli, Uttar Pradesh | Khatauli, Uttar Pradesh |
| 26902 | Naiya | Uttar Pradesh | 16.5 km | Kakrehia | mouth |  | Laharpur, Uttar Pradesh | 16 km NE of Biswan, Uttar Pradesh |
| 27377 | Parasi Nala | Uttar Pradesh | 65.8 km | Chaur Tal | mouth |  | 18 km E of Utraula, Uttar Pradesh | Bansi, Uttar Pradesh |
| 27654 | Piyas/ Jharai | Uttar Pradesh | 54.5 km | Basmania | mouth |  | 45 km E of Butwal, Nepal | Maharaganj, Uttar Pradesh |
| 27986 | Rustamgarh Ramnagar Drain | Uttar Pradesh | 2.8 km | Isan | mouth |  | Etah, Uttar Pradesh | Etah, Uttar Pradesh |
| 28609 | Sot or Yar - I - Wafadar | Uttar Pradesh | 327.8 km | Bukharakhar Nala | mouth |  | Amroha, Uttar Pradesh | Shamsabad, Uttar Pradesh |
| 28759 | Surajkunda | Uttar Pradesh | 21.4 km | Gholiya | mouth |  | 30 km SW of Tulsipur, Nepal | Bhinga, Uttar Pradesh |
| 26394 | Mahar Gad | Uttarakhand | 4.8 km | Khetar Gad | mouth |  | Himalayas, 35 km N of Pithoragarh, Uttarakhand | 30 km N of Pithoragarh, Uttarakhand |
| 21686 | Bara Baikhali Khal | West Bengal | 4.3 km | Jhila | mouth |  | Sundarbans, 85 km SE of Kolkata, West Bengal | 80 km SE of Kolkata, West Bengal |
| 23569 | Gachha Khal | West Bengal | 61.3 km | Ichamati | mouth |  | 18 km NE of Krishnanagar, West Bengal | Bagula, West Bengal |
| 24731 | Jhila | West Bengal | 30.5 km | Dattar Gang | mouth |  | Sundarbans, 75 km SE of Kolkata, West Bengal | 85 km SE of Kolkata, West Bengal |
| 28251 | Satpukur | West Bengal | 12.6 km | Gayer | mouth |  | Sundarbans, 55 km S of Kolkata, West Bengal | 60 km S of Kolkata, West Bengal |
